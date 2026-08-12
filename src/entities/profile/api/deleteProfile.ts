import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';

export const deleteProfile = async (userId: string): Promise<void> => {
  const supabase = createBrowserClient();
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', userId);

  if (error) {
    throw error;
  }
};
