import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { Household } from '../model/household';
import type { UpdateHouseholdReq } from '../model/updateHouseholdReq';

export const updateHousehold = async (
  payload: UpdateHouseholdReq,
): Promise<Household> => {
  const { id, ...updates } = payload;
  const supabase = createBrowserClient();
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
