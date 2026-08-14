import type { SupabaseClient } from '@/shared/api';

import { mapInviteError } from '../lib/mapInviteError';
import { TABLE_NAME } from '../config/tableName';
import type { CreateHouseholdInviteReq } from '../model/createHouseholdInviteReq';
import type { HouseholdInvite } from '../model/householdInvite';

export const createHouseholdInvite = async (
  supabase: SupabaseClient,
  payload: CreateHouseholdInviteReq,
): Promise<HouseholdInvite> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      ...payload,
      email: payload.email.trim().toLowerCase(),
    })
    .select('*')
    .single();

  if (error) {
    throw mapInviteError(error);
  }

  return data;
};
