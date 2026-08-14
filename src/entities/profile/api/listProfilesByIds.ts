import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { Profile } from '../model/profile';

export const listProfilesByIds = async (
  supabase: SupabaseClient,
  ids: string[],
): Promise<Profile[]> => {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .in('id', ids);

  if (error) {
    throw error;
  }

  return data ?? [];
};
