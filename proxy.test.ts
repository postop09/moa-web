// @vitest-environment node
import { NextRequest } from 'next/server';
import { AuthError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { proxy } from './proxy';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[]) => void;
};

const getClaimsMock = vi.fn();
let capturedCookieMethods: CookieMethods | null = null;

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(
    (_url: string, _key: string, options: { cookies: CookieMethods }) => {
      capturedCookieMethods = options.cookies;
      return { auth: { getClaims: getClaimsMock } };
    },
  ),
}));

vi.mock('@/shared/api/server', () => ({
  getSupabaseJwks: vi.fn(async () => undefined),
}));

const ORIGIN = 'https://moa.test';
const GATE_COOKIE = 'moa_gate';
const USER_ID = 'user-1';

const NO_SESSION = { data: null, error: null };
const SESSION = { data: { claims: { sub: USER_ID } }, error: null };

const REFRESHED_COOKIE: CookieToSet = {
  name: 'sb-test-auth-token',
  value: 'refreshed',
  options: { httpOnly: true, maxAge: 3600, path: '/', sameSite: 'lax' },
};

const createRequest = (path: string, cookie?: string) => {
  return new NextRequest(new URL(path, ORIGIN), {
    headers: cookie ? { cookie } : {},
  });
};

const getLocationPath = (response: Response) => {
  const location = response.headers.get('Location');
  if (!location) {
    return null;
  }
  const url = new URL(location);
  return `${url.pathname}${url.search}`;
};

const getSetCookies = (response: Response) => {
  return response.headers.getSetCookie();
};

const findGateDeletion = (setCookies: string[]) => {
  return setCookies.find((cookie) => {
    if (!cookie.startsWith(`${GATE_COOKIE}=`)) {
      return false;
    }
    const lower = cookie.toLowerCase();
    const hasMaxAgeZero = /max-age=0(;|$)/.test(lower);
    const expiresMatch = /expires=([^;]+)/.exec(lower);
    const hasPastExpires =
      expiresMatch !== null && new Date(expiresMatch[1]).getTime() < Date.now();
    return hasMaxAgeZero || hasPastExpires;
  });
};

const expectRedirect = (response: Response, expectedPath: string) => {
  expect([307, 308]).toContain(response.status);
  expect(getLocationPath(response)).toBe(expectedPath);
};

const expectServerTiming = (response: Response) => {
  expect(response.headers.get('Server-Timing')).toMatch(/^auth;dur=\d+$/);
};

describe('proxy', () => {
  beforeEach(() => {
    getClaimsMock.mockReset();
    capturedCookieMethods = null;
  });

  describe('세션 없음', () => {
    beforeEach(() => {
      getClaimsMock.mockResolvedValue(NO_SESSION);
    });

    it('앱 경로(/history)는 /login으로 리다이렉트하고 moa_gate를 삭제한다', async () => {
      const response = await proxy(createRequest('/history'));

      expectRedirect(response, '/login');
      expect(findGateDeletion(getSetCookies(response))).toBeDefined();
    });

    it('루트(/)는 /welcome으로 리다이렉트하고 moa_gate를 삭제한다', async () => {
      const response = await proxy(createRequest('/'));

      expectRedirect(response, '/welcome');
      expect(findGateDeletion(getSetCookies(response))).toBeDefined();
    });

    it('일반 AuthError면 /login으로 보내며 moa_gate를 삭제한다', async () => {
      getClaimsMock.mockResolvedValue({
        data: null,
        error: new AuthError('invalid token', 401, 'bad_jwt'),
      });

      const response = await proxy(createRequest('/history'));

      expectRedirect(response, '/login');
      expect(findGateDeletion(getSetCookies(response))).toBeDefined();
    });

    it('일시적 네트워크 오류(AuthRetryableFetchError)면 /login으로 보내되 moa_gate는 지우지 않는다', async () => {
      getClaimsMock.mockResolvedValue({
        data: null,
        error: new AuthRetryableFetchError('fetch failed', 0),
      });

      const response = await proxy(
        createRequest('/history', `${GATE_COOKIE}=ready:${USER_ID}`),
      );

      expectRedirect(response, '/login');
      expect(findGateDeletion(getSetCookies(response))).toBeUndefined();
    });
  });

  describe('세션 있음 + ready 쿠키 일치', () => {
    const readyCookie = `${GATE_COOKIE}=ready:${USER_ID}`;

    beforeEach(() => {
      getClaimsMock.mockResolvedValue(SESSION);
    });

    it('앱 경로(/)는 리다이렉트 없이 통과하고 Server-Timing을 싣는다', async () => {
      const response = await proxy(createRequest('/', readyCookie));

      expect(response.status).toBe(200);
      expect(response.headers.get('Location')).toBeNull();
      expectServerTiming(response);
    });

    it('/login으로 오면 /로 리다이렉트한다', async () => {
      const response = await proxy(createRequest('/login', readyCookie));

      expectRedirect(response, '/');
    });

    it('/onboarding/profile로 오면 /로 리다이렉트한다', async () => {
      const response = await proxy(
        createRequest('/onboarding/profile', readyCookie),
      );

      expectRedirect(response, '/');
    });
  });

  describe('세션 있음 + ready 쿠키 없음/불일치', () => {
    beforeEach(() => {
      getClaimsMock.mockResolvedValue(SESSION);
    });

    it('moa_gate가 없으면 /history는 /auth/complete?next=%2Fhistory로 리다이렉트한다', async () => {
      const response = await proxy(createRequest('/history'));

      expectRedirect(response, '/auth/complete?next=%2Fhistory');
    });

    it('moa_gate가 다른 사용자 것이면 /auth/complete로 리다이렉트한다', async () => {
      const response = await proxy(
        createRequest('/history', `${GATE_COOKIE}=ready:user-OTHER`),
      );

      expectRedirect(response, '/auth/complete?next=%2Fhistory');
    });

    it('세션 리프레시로 세팅된 쿠키의 속성(HttpOnly/Max-Age/Path/SameSite)을 리다이렉트 응답에 보존한다', async () => {
      getClaimsMock.mockImplementation(async () => {
        capturedCookieMethods?.setAll([REFRESHED_COOKIE]);
        return SESSION;
      });

      const response = await proxy(createRequest('/history'));

      expectRedirect(response, '/auth/complete?next=%2Fhistory');
      expectServerTiming(response);

      const refreshed = getSetCookies(response).find((cookie) =>
        cookie.startsWith('sb-test-auth-token=refreshed'),
      );
      expect(refreshed).toBeDefined();
      const lower = refreshed!.toLowerCase();
      expect(lower).toContain('httponly');
      expect(lower).toMatch(/max-age=3600(;|$)/);
      expect(lower).toMatch(/path=\/(;|$)/);
      expect(lower).toMatch(/samesite=lax(;|$)/);
    });
  });
});
