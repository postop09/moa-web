'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  updateTransaction,
  type UpdateTransactionReq,
} from '@/entities/transaction';
import { createBrowserClient } from '@/shared/api';

import { transactionQueryKeys } from '../config/queryKeys';

export const useUpdateTransaction = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateTransactionReq) => {
      const supabase = createBrowserClient();
      return updateTransaction(supabase, payload);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: transactionQueryKeys.list(householdId),
      });
      void queryClient.invalidateQueries({
        queryKey: transactionQueryKeys.detail(data.id),
      });
    },
  });
};
