import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { Category } from '../model/category';
import type { UpdateCategoryReq } from '../model/updateCategoryReq';

export const updateCategory = async (
  supabase: SupabaseClient,
  payload: UpdateCategoryReq,
): Promise<Category> => {
  const { id, ...updates } = payload;
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
