import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ScheduleCategory } from '../model/scheduleCategory';
import type { UpdateScheduleCategoryReq } from '../model/updateScheduleCategoryReq';

export const updateScheduleCategory = async (
  supabase: SupabaseClient,
  payload: UpdateScheduleCategoryReq,
): Promise<ScheduleCategory> => {
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
