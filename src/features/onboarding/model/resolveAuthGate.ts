import { listHouseholdMembersByUserId } from '@/entities/householdMember';
import { getProfile } from '@/entities/profile';
import { createServerClient } from '@/shared/api/server';

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
    return { status: 'unauthenticated', redirectTo: '/login' };
  }

  const profile = await getProfile(supabase, user.id);

  if (!profile) {
    return {
      status: 'needsProfile',
      redirectTo: '/onboarding/profile',
      userId: user.id,
    };
  }

  const memberships = await listHouseholdMembersByUserId(supabase, user.id);

  if (memberships.length === 0) {
    return {
      status: 'needsHousehold',
      redirectTo: '/onboarding/household',
      userId: user.id,
    };
  }

  return { status: 'ready', userId: user.id };
};
