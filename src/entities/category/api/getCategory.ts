import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { GetCategoryRes } from '../model/getCategoryRes';

export const getCategory = async (
  supabase: SupabaseClient,
  id: number,
): Promise<GetCategoryRes> => {
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
