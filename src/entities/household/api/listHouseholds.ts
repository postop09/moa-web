import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListHouseholdsRes } from '../model/listHouseholdsRes';

export const listHouseholds = async (): Promise<ListHouseholdsRes> => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};
