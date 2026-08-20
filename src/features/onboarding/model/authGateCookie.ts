import { cookies } from 'next/headers';

import {
  AUTH_GATE_COOKIE_NAME,
  AUTH_GATE_COOKIE_OPTIONS,
  toAuthGateReadyValue,
} from '@/shared/config';

export const setAuthGateReadyCookie = async (userId: string) => {
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_GATE_COOKIE_NAME,
    toAuthGateReadyValue(userId),
    AUTH_GATE_COOKIE_OPTIONS,
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
