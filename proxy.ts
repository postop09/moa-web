import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_GATE_COOKIE_NAME, getAuthGateReadyUserId } from '@/shared/config';

const isPassThroughPath = (pathname: string) => {
  return pathname.startsWith('/invite/') || pathname.startsWith('/auth/');
};

const PUBLIC_PATHS = new Set(['/login', '/welcome', '/privacy', '/terms']);

const isLoginPath = (pathname: string) => {
  return pathname === '/login';
};

const isPublicPath = (pathname: string) => {
  return PUBLIC_PATHS.has(pathname);
};

const isOnboardingPath = (pathname: string) => {
  return pathname.startsWith('/onboarding/');
};

const isAppPath = (pathname: string) => {
  return (
    !isPassThroughPath(pathname) &&
    !isPublicPath(pathname) &&
    !isOnboardingPath(pathname)
  );
};

const copyCookies = (from: NextResponse, to: NextResponse) => {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
};

const redirectWithCookies = (supabaseResponse: NextResponse, url: URL) => {
  const redirectResponse = NextResponse.redirect(url);
  copyCookies(supabaseResponse, redirectResponse);
  return redirectResponse;
};

export const proxy = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user) {
    if (isPassThroughPath(pathname)) {
      return supabaseResponse;
    }

    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      // 크롤러는 항상 비로그인 상태이므로 도메인 루트는 랜딩 페이지로 보낸다.
      url.pathname = pathname === '/' ? '/welcome' : '/login';
      url.search = '';
      const redirectResponse = redirectWithCookies(supabaseResponse, url);
      redirectResponse.cookies.delete({
        name: AUTH_GATE_COOKIE_NAME,
        path: '/',
      });
      return redirectResponse;
    }

    supabaseResponse.cookies.delete({
      name: AUTH_GATE_COOKIE_NAME,
      path: '/',
    });
    return supabaseResponse;
  }

  const readyUserId = getAuthGateReadyUserId(
    request.cookies.get(AUTH_GATE_COOKIE_NAME)?.value,
  );
  const isReady = readyUserId === user.id;

  if (isReady) {
    if (isLoginPath(pathname) || isOnboardingPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return redirectWithCookies(supabaseResponse, url);
    }

    return supabaseResponse;
  }

  if (isAppPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/complete';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return redirectWithCookies(supabaseResponse, url);
  }

  return supabaseResponse;
};

export const config = {
  matcher: [
    '/',
    '/login',
    '/welcome',
    '/onboarding/:path*',
    '/invite/:path*',
    '/auth/:path*',
    '/history',
    '/stats',
    '/write',
    '/write/:path*',
    '/calendar',
    '/settings',
  ],
};
