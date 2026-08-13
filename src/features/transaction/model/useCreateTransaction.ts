'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createTransaction,
  type CreateTransactionReq,
} from '@/entities/transaction';
import { createBrowserClient } from '@/shared/api';

import { transactionQueryKeys } from '../config/queryKeys';

type CreateTransactionInput = Omit<CreateTransactionReq, 'createdBy'>;

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTransactionInput) => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      return createTransaction(supabase, {
        ...payload,
        createdBy: user.id,
      });
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: transactionQueryKeys.list(data.householdId),
      });
    },
  });
};
