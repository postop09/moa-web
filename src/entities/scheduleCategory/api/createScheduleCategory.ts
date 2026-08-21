import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { CreateScheduleCategoryReq } from '../model/createScheduleCategoryReq';
import type { ScheduleCategory } from '../model/scheduleCategory';

export const createScheduleCategory = async (
  supabase: SupabaseClient,
  payload: CreateScheduleCategoryReq,
): Promise<ScheduleCategory> => {
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
