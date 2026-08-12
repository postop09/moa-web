import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { GetHouseholdRes } from '../model/getHouseholdRes';

export const getHousehold = async (
  householdId: string,
): Promise<GetHouseholdRes> => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', householdId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};
