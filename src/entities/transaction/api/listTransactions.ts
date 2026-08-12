import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListTransactionsReq } from '../model/listTransactionsReq';
import type { ListTransactionsRes } from '../model/listTransactionsRes';

export const listTransactions = async (
  supabase: SupabaseClient,
  payload: ListTransactionsReq,
): Promise<ListTransactionsRes> => {
  const { householdId, from, to } = payload;

  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('householdId', householdId)
    .order('transactionDt', { ascending: false });

  if (from) {
    query = query.gte('transactionDt', from);
  }

  if (to) {
    query = query.lte('transactionDt', to);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
};
