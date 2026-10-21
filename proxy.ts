import { createServerClient } from '@supabase/ssr';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { getSupabaseJwks } from '@/shared/api/server';
import { AUTH_GATE_COOKIE_NAME, getAuthGateReadyUserId } from '@/shared/config';

const SERVER_TIMING_HEADER = 'Server-Timing';

const isPassThroughPath = (pathname: string) => {
  return pathname.startsWith('/invite/') || pathname.startsWith('/auth/');
};

// matcher(하단 config.matcher)에 없는 경로는 proxy가 아예 실행되지 않는다.
// '/privacy', '/terms'는 matcher에 없어(항상 공개) 이 Set에 넣어도 도달하지 않는다.
const PUBLIC_PATHS = new Set(['/login', '/welcome']);

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

// (name, value)만 복사하면 httpOnly/maxAge 등이 유실돼 리프레시 쿠키가 세션 쿠키로 격하된다.
const copyCookies = (from: NextResponse, to: NextResponse) => {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
};

const setAuthTiming = (response: NextResponse, durationMs: number) => {
  response.headers.set(
    SERVER_TIMING_HEADER,
    `auth;dur=${Math.round(durationMs)}`,
  );
};

const redirectWithCookies = (supabaseResponse: NextResponse, url: URL) => {
  const redirectResponse = NextResponse.redirect(url);
  copyCookies(supabaseResponse, redirectResponse);

  const serverTiming = supabaseResponse.headers.get(SERVER_TIMING_HEADER);
  if (serverTiming) {
    redirectResponse.headers.set(SERVER_TIMING_HEADER, serverTiming);
  }

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

  const authStartedAt = performance.now();
  // getUser는 매 요청 Auth 서버를 왕복하지만 getClaims는 JWKS로 로컬 검증한다.
  const jwks = await getSupabaseJwks();
  const { data, error } = await supabase.auth.getClaims(undefined, { jwks });
  const userId = data?.claims.sub ?? null;
  // 네트워크 블립(리프레시 실패 등)은 로그아웃이 아니므로 30일 moa_gate를 지우면 안 된다.
  const isTransientAuthError = isAuthRetryableFetchError(error);
  setAuthTiming(supabaseResponse, performance.now() - authStartedAt);

  const { pathname } = request.nextUrl;

  if (!userId) {
    if (isPassThroughPath(pathname)) {
      return supabaseResponse;
    }

    // 일시적 오류여도 검증되지 않은 요청을 앱 경로로 통과시키지 않기 위해 리다이렉트는 유지한다.
    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      // 크롤러는 항상 비로그인 상태이므로 도메인 루트는 랜딩 페이지로 보낸다.
      url.pathname = pathname === '/' ? '/welcome' : '/login';
      url.search = '';
      const redirectResponse = redirectWithCookies(supabaseResponse, url);
      if (!isTransientAuthError) {
        redirectResponse.cookies.delete({
          name: AUTH_GATE_COOKIE_NAME,
          path: '/',
        });
      }
      return redirectResponse;
    }

    if (!isTransientAuthError) {
      supabaseResponse.cookies.delete({
        name: AUTH_GATE_COOKIE_NAME,
        path: '/',
      });
    }
    return supabaseResponse;
  }

  const readyUserId = getAuthGateReadyUserId(
    request.cookies.get(AUTH_GATE_COOKIE_NAME)?.value,
  );
  const isReady = readyUserId === userId;

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
