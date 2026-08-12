import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { CreateProfileReq } from '../model/createProfileReq';
import type { Profile } from '../model/profile';

export const createProfile = async (
  payload: CreateProfileReq,
): Promise<Profile> => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
