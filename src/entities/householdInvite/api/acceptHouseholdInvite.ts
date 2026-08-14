import type { SupabaseClient } from '@/shared/api';

import { mapInviteError } from '../lib/mapInviteError';

export const acceptHouseholdInvite = async (
  supabase: SupabaseClient,
  token: string,
): Promise<void> => {
  const { error } = await supabase.rpc('accept_household_invite', {
    p_token: token,
  });

  if (error) {
    throw mapInviteError(error);
  }
};
