import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';

export const deleteProfile = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', userId);

  if (error) {
    throw error;
  }
};
