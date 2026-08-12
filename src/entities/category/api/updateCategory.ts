import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { Category } from '../model/category';
import type { UpdateCategoryReq } from '../model/updateCategoryReq';

export const updateCategory = async (
  payload: UpdateCategoryReq,
): Promise<Category> => {
  const { id, ...updates } = payload;
  const supabase = createBrowserClient();
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
