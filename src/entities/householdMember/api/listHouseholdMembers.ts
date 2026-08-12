import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListHouseholdMembersRes } from '../model/listHouseholdMembersRes';

export const listHouseholdMembers = async (
  supabase: SupabaseClient,
  householdId: string,
): Promise<ListHouseholdMembersRes> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('householdId', householdId)
    .order('joinedAt', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};
