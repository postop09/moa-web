import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { GetCategoryRes } from '../model/getCategoryRes';

export const getCategory = async (id: number): Promise<GetCategoryRes> => {
  const supabase = createBrowserClient();
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
