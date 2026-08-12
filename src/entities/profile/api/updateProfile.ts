import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { Profile } from '../model/profile';
import type { UpdateProfileReq } from '../model/updateProfileReq';

export const updateProfile = async (
  supabase: SupabaseClient,
  payload: UpdateProfileReq,
): Promise<Profile> => {
  const { id, ...updates } = payload;
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
