import { NextResponse } from 'next/server';

import {
  applyAuthGateCookie,
  getAuthGateRedirectPath,
  resolveAuthGate,
} from '@/features/onboarding/server';
import { getSafeNextPath } from '@/shared/lib';

export const authComplete = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url);
  const next = getSafeNextPath(searchParams.get('next'));
  const gate = await resolveAuthGate();
  const redirectPath = getAuthGateRedirectPath(gate, next);
  const response = NextResponse.redirect(new URL(redirectPath, origin));

  applyAuthGateCookie(response, gate);

  return response;
};
