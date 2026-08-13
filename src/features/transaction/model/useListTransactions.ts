'use client';

import { useQuery } from '@tanstack/react-query';

import {
  listTransactions,
  type ListTransactionsReq,
} from '@/entities/transaction';
import { createBrowserClient } from '@/shared/api';

import { transactionQueryKeys } from '../config/queryKeys';

export const useListTransactions = (payload: ListTransactionsReq | null) => {
  const householdId = payload?.householdId ?? '';
  const from = payload?.from;
  const to = payload?.to;

  return useQuery({
    queryKey: transactionQueryKeys.list(householdId, from, to),
    queryFn: async () => {
      if (!payload?.householdId) {
        throw new Error('householdId가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return listTransactions(supabase, payload);
    },
    enabled: !!payload?.householdId,
  });
};
