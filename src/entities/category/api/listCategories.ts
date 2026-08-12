import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListCategoriesRes } from '../model/listCategoriesRes';

export const listCategories = async (
  householdId: string,
): Promise<ListCategoriesRes> => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('householdId', householdId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};
