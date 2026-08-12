import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';
import type { GetTransactionRes } from '../model/getTransactionRes';

export const getTransaction = async (
  supabase: SupabaseClient,
  id: number,
): Promise<GetTransactionRes> => {
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
