import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { CreateHouseholdReq } from '../model/createHouseholdReq';
import type { Household } from '../model/household';

export const createHousehold = async (
  payload: CreateHouseholdReq,
): Promise<Household> => {
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
