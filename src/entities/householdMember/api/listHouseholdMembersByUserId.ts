import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListHouseholdMembersRes } from '../model/listHouseholdMembersRes';

export const listHouseholdMembersByUserId = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<ListHouseholdMembersRes> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('userId', userId)
    .order('joinedAt', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};
