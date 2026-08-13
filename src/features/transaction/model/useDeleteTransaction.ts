'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteTransaction } from '@/entities/transaction';
import { createBrowserClient } from '@/shared/api';

import { transactionQueryKeys } from '../config/queryKeys';

export const useDeleteTransaction = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = createBrowserClient();
      await deleteTransaction(supabase, id);
      return id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({
        queryKey: transactionQueryKeys.lists(householdId),
      });
      void queryClient.invalidateQueries({
        queryKey: transactionQueryKeys.detail(id),
      });
    },
  });
};
