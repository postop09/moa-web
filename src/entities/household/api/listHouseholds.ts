import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListHouseholdsRes } from '../model/listHouseholdsRes';

export const listHouseholds = async (
  supabase: SupabaseClient,
): Promise<ListHouseholdsRes> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('createdAt', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};
