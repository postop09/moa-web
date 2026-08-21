import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListScheduleCategoriesRes } from '../model/listScheduleCategoriesRes';

export const listScheduleCategories = async (
  supabase: SupabaseClient,
  householdId: string,
): Promise<ListScheduleCategoriesRes> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('householdId', householdId)
    .order('createdDt', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};
