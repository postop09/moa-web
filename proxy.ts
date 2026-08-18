import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_GATE_COOKIE_NAME } from '@/shared/config';

const isPublicPath = (pathname: string) => {
  return pathname === '/login' || pathname.startsWith('/invite/');
};

const copyCookies = (from: NextResponse, to: NextResponse) => {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
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

  if (!user) {
    if (!isPublicPath(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(supabaseResponse, redirectResponse);
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
  }

  return supabaseResponse;
};

export const config = {
  matcher: [
    '/',
    '/login',
    '/onboarding/:path*',
    '/invite/:path*',
    '/history',
    '/stats',
    '/write',
    '/write/:path*',
    '/calendar',
    '/settings',
  ],
};
