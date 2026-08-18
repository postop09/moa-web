import { cookies } from 'next/headers';

import {
  AUTH_GATE_COOKIE_NAME,
  getAuthGateReadyUserId,
  toAuthGateReadyValue,
} from '@/shared/config';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

export const getAuthGateCookieValue = async () => {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_GATE_COOKIE_NAME)?.value;
};

export const getReadyAuthGateUserId = async () => {
  return getAuthGateReadyUserId(await getAuthGateCookieValue());
};

export const setAuthGateReadyCookie = async (userId: string) => {
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_GATE_COOKIE_NAME,
    toAuthGateReadyValue(userId),
    cookieOptions,
  );
};

export const clearAuthGateCookie = async () => {
  const cookieStore = await cookies();

  cookieStore.delete({
    name: AUTH_GATE_COOKIE_NAME,
    path: '/',
  });
};

export const trySetAuthGateReadyCookie = async (userId: string) => {
  try {
    await setAuthGateReadyCookie(userId);
  } catch {
    // Server Component 렌더 중에는 쿠키 set이 거부될 수 있음
  }
};

export const tryClearAuthGateCookie = async () => {
  try {
    await clearAuthGateCookie();
  } catch {
    // Server Component 렌더 중에는 쿠키 삭제가 거부될 수 있음
  }
};
