import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { CreateTransactionReq } from '../model/createTransactionReq';
import type { Transaction } from '../model/transaction';

export const createTransaction = async (
  supabase: SupabaseClient,
  payload: CreateTransactionReq,
): Promise<Transaction> => {
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
