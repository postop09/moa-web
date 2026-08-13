'use client';

import { useQuery } from '@tanstack/react-query';

import { getTransaction } from '@/entities/transaction';
import { createBrowserClient } from '@/shared/api';

import { transactionQueryKeys } from '../config/queryKeys';

export const useGetTransaction = (id: number | null) => {
  return useQuery({
    queryKey: transactionQueryKeys.detail(id ?? 0),
    queryFn: async () => {
      if (id === null || !Number.isFinite(id)) {
        throw new Error('거래 ID가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return getTransaction(supabase, id);
    },
    enabled: id !== null && Number.isFinite(id),
  });
};
