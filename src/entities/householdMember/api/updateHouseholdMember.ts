import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { HouseholdMember } from '../model/householdMember';
import type { UpdateHouseholdMemberReq } from '../model/updateHouseholdMemberReq';

export const updateHouseholdMember = async (
  supabase: SupabaseClient,
  payload: UpdateHouseholdMemberReq,
): Promise<HouseholdMember> => {
  const { id, ...updates } = payload;
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
