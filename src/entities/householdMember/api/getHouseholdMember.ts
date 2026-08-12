import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { GetHouseholdMemberRes } from '../model/getHouseholdMemberRes';

export const getHouseholdMember = async (
  supabase: SupabaseClient,
  id: number,
): Promise<GetHouseholdMemberRes> => {
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
