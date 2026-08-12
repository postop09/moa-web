import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { GetProfileRes } from '../model/getProfileRes';

export const getProfile = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<GetProfileRes | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};
