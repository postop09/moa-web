import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { GetScheduleRes } from '../model/getScheduleRes';

export const getSchedule = async (
  supabase: SupabaseClient,
  id: number,
): Promise<GetScheduleRes> => {
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
