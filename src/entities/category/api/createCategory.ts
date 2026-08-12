import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { Category } from '../model/category';
import type { CreateCategoryReq } from '../model/createCategoryReq';

export const createCategory = async (
  supabase: SupabaseClient,
  payload: CreateCategoryReq,
): Promise<Category> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
