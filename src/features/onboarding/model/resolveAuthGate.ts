import { NextResponse } from 'next/server';

import { listHouseholdMembersByUserId } from '@/entities/householdMember';
import { getProfile } from '@/entities/profile';
import { createServerClient } from '@/shared/api/server';
import {
  AUTH_GATE_COOKIE_NAME,
  AUTH_GATE_COOKIE_OPTIONS,
  toAuthGateReadyValue,
} from '@/shared/config';

import {
  tryClearAuthGateCookie,
  trySetAuthGateReadyCookie,
} from './authGateCookie';

export type AuthGateResult =
  | { status: 'unauthenticated'; redirectTo: '/login' }
  | {
      status: 'needsProfile';
      redirectTo: '/onboarding/profile';
      userId: string;
    }
  | {
      status: 'needsHousehold';
      redirectTo: '/onboarding/household';
      userId: string;
    }
  | { status: 'ready'; userId: string };

export const resolveAuthGate = async (): Promise<AuthGateResult> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await tryClearAuthGateCookie();
    return { status: 'unauthenticated', redirectTo: '/login' };
  }

  const [profile, memberships] = await Promise.all([
    getProfile(supabase, user.id),
    listHouseholdMembersByUserId(supabase, user.id),
  ]);

  if (!profile) {
    await tryClearAuthGateCookie();
    return {
      status: 'needsProfile',
      redirectTo: '/onboarding/profile',
      userId: user.id,
    };
  }

  if (memberships.length === 0) {
    await tryClearAuthGateCookie();
    return {
      status: 'needsHousehold',
      redirectTo: '/onboarding/household',
      userId: user.id,
    };
  }

  await trySetAuthGateReadyCookie(user.id);

  return { status: 'ready', userId: user.id };
};

const getAuthGateRedirectPath = (gate: AuthGateResult, next: string | null) => {
  if (gate.status === 'unauthenticated') {
    return next ? `/login?next=${encodeURIComponent(next)}` : '/login';
  }

  if (gate.status === 'ready') {
    return next ?? '/';
  }

  if (gate.status === 'needsProfile') {
    return next
      ? `/onboarding/profile?next=${encodeURIComponent(next)}`
      : '/onboarding/profile';
  }

  if (next?.startsWith('/invite/')) {
    return next;
  }

  return '/onboarding/household';
};

const applyAuthGateCookie = (response: NextResponse, gate: AuthGateResult) => {
  if (gate.status === 'ready') {
    response.cookies.set(
      AUTH_GATE_COOKIE_NAME,
      toAuthGateReadyValue(gate.userId),
      AUTH_GATE_COOKIE_OPTIONS,
    );
    return;
  }

  response.cookies.delete({
    name: AUTH_GATE_COOKIE_NAME,
    path: '/',
  });
};

export const redirectForAuthGate = async (
  origin: string,
  next: string | null,
) => {
  const gate = await resolveAuthGate();
  const redirectPath = getAuthGateRedirectPath(gate, next);
  const response = NextResponse.redirect(new URL(redirectPath, origin));

  applyAuthGateCookie(response, gate);

  return response;
};
