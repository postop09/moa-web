import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { GetHouseholdMemberRes } from '../model/getHouseholdMemberRes';

export const getHouseholdMember = async (
  id: number,
): Promise<GetHouseholdMemberRes> => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
};
