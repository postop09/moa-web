import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListSchedulesReq } from '../model/listSchedulesReq';
import type { ListSchedulesRes } from '../model/listSchedulesRes';

export const listSchedules = async (
  supabase: SupabaseClient,
  payload: ListSchedulesReq,
): Promise<ListSchedulesRes> => {
  const { householdId, from, to } = payload;

  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('householdId', householdId)
    .order('startAt', { ascending: true });

  if (from) {
    query = query.gte('startAt', from);
  }

  if (to) {
    query = query.lte('startAt', to);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
};
