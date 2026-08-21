import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { CreateScheduleReq } from '../model/createScheduleReq';
import type { Schedule } from '../model/schedule';

export const createSchedule = async (
  supabase: SupabaseClient,
  payload: CreateScheduleReq,
): Promise<Schedule> => {
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
