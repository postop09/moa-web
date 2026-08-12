import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';

export const deleteCategory = async (id: number): Promise<void> => {
  const supabase = createBrowserClient();
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) {
    throw error;
  }
};
