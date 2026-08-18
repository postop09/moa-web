import { listHouseholdMembersByUserId } from '@/entities/householdMember';
import { getProfile } from '@/entities/profile';
import { createServerClient } from '@/shared/api/server';

import {
  getReadyAuthGateUserId,
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

type ResolveAuthGateOptions = {
  allowReadyCookie?: boolean;
};

export const resolveAuthGate = async (
  options?: ResolveAuthGateOptions,
): Promise<AuthGateResult> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await tryClearAuthGateCookie();
    return { status: 'unauthenticated', redirectTo: '/login' };
  }

  if (options?.allowReadyCookie) {
    const readyUserId = await getReadyAuthGateUserId();

    if (readyUserId === user.id) {
      return { status: 'ready', userId: user.id };
    }
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

export const resolveAppAuthGate = async () => {
  const readyUserId = await getReadyAuthGateUserId();
  const gate = await resolveAuthGate({ allowReadyCookie: true });
  const shouldPersistReadyCookie =
    gate.status === 'ready' && readyUserId !== gate.userId;

  return {
    gate,
    shouldPersistReadyCookie,
  };
};
