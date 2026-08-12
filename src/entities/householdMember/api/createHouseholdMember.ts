import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { CreateHouseholdMemberReq } from '../model/createHouseholdMemberReq';
import type { HouseholdMember } from '../model/householdMember';

export const createHouseholdMember = async (
  payload: CreateHouseholdMemberReq,
): Promise<HouseholdMember> => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
