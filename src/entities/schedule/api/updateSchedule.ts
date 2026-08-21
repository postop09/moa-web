import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { Schedule } from '../model/schedule';
import type { UpdateScheduleReq } from '../model/updateScheduleReq';

export const updateSchedule = async (
  supabase: SupabaseClient,
  payload: UpdateScheduleReq,
): Promise<Schedule> => {
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
