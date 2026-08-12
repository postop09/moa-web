import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { Transaction } from '../model/transaction';
import type { UpdateTransactionReq } from '../model/updateTransactionReq';

export const updateTransaction = async (
  supabase: SupabaseClient,
  payload: UpdateTransactionReq,
): Promise<Transaction> => {
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
