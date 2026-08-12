import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';

export const deleteCategory = async (
  supabase: SupabaseClient,
  id: number,
): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) {
    throw error;
  }
};
