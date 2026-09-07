import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { ListTransactionsReq } from '../model/listTransactionsReq';
import type { ListTransactionsRes } from '../model/listTransactionsRes';

export const listTransactions = async (
  supabase: SupabaseClient,
  payload: ListTransactionsReq,
): Promise<ListTransactionsRes> => {
  const { householdId, from, to, type, categoryId, limit, offset } = payload;

  let query = supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact' })
    .eq('householdId', householdId)
    .order('transactionDt', { ascending: false })
    .order('id', { ascending: false });

  if (from) {
    query = query.gte('transactionDt', from);
  }

  if (to) {
    query = query.lte('transactionDt', to);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (categoryId !== undefined) {
    query = query.eq('categoryId', categoryId);
  }

  if (limit !== undefined) {
    const start = offset ?? 0;
    query = query.range(start, start + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { data: data ?? [], count: count ?? null };
};
