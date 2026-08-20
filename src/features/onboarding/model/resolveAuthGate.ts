import { listHouseholdMembersByUserId } from '@/entities/householdMember';
import { getProfile } from '@/entities/profile';
import { createServerClient } from '@/shared/api/server';

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
