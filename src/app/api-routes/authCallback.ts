import { NextResponse } from 'next/server';

import {
  applyAuthGateCookie,
  getAuthGateRedirectPath,
  resolveAuthGate,
} from '@/features/onboarding/server';
import { createServerClient } from '@/shared/api/server';
import { getSafeNextPath } from '@/shared/lib';

export const authCallback = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const gate = await resolveAuthGate();
      const redirectPath = getAuthGateRedirectPath(gate, next);
      const response = NextResponse.redirect(new URL(redirectPath, origin));

      applyAuthGateCookie(response, gate);

      return response;
    }
  }

  return NextResponse.redirect(new URL('/login', origin));
};
