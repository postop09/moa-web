import { NextResponse } from 'next/server';

import { redirectForAuthGate } from '@/features/onboarding/server';
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
      return redirectForAuthGate(origin, next);
    }
  }

  return NextResponse.redirect(new URL('/login', origin));
};
