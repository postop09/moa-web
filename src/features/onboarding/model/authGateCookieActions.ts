'use server';

import { createServerClient } from '@/shared/api/server';

import { clearAuthGateCookie, setAuthGateReadyCookie } from './authGateCookie';

export const persistAuthGateReadyCookie = async () => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await setAuthGateReadyCookie(user.id);
};

export const clearAuthGateReadyCookie = async () => {
  await clearAuthGateCookie();
};
