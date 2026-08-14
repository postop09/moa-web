import type { SupabaseClient } from '@/shared/api';

import { mapInviteError } from '../lib/mapInviteError';
import type { GetHouseholdInviteByTokenRes } from '../model/getHouseholdInviteByTokenRes';

export const getHouseholdInviteByToken = async (
  supabase: SupabaseClient,
  token: string,
): Promise<GetHouseholdInviteByTokenRes | null> => {
  const { data, error } = await supabase.rpc('get_household_invite_by_token', {
    p_token: token,
  });

  if (error) {
    throw mapInviteError(error);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return null;
  }

  return row as GetHouseholdInviteByTokenRes;
};
