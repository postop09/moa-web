'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { listTransactions } from '@/entities/transaction';
import type { TransactionType } from '@/shared/model';
import { createBrowserClient } from '@/shared/api';

import { transactionQueryKeys } from '../config/queryKeys';

export type InfiniteTransactionsParams = {
  householdId: string;
  from?: string;
  to?: string;
  type?: TransactionType | 'all';
  categoryId?: number | 'all';
  limit: number;
};

export const useInfiniteTransactions = (
  payload: InfiniteTransactionsParams | null,
) => {
  const householdId = payload?.householdId ?? '';
  const from = payload?.from;
  const to = payload?.to;
  const type = payload?.type;
  const categoryId = payload?.categoryId;
  const limit = payload?.limit ?? 50;

  return useInfiniteQuery({
    queryKey: transactionQueryKeys.infiniteList(householdId, {
      from,
      to,
      type,
      categoryId,
      limit,
    }),
    queryFn: async ({ pageParam }) => {
      if (!payload?.householdId) {
        throw new Error('householdId가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return listTransactions(supabase, {
        householdId: payload.householdId,
        from,
        to,
        type: type === 'all' ? undefined : type,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        limit,
        offset: pageParam,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.data.length, 0);
      if (lastPage.count !== null && loaded >= lastPage.count) {
        return undefined;
      }
      if (lastPage.data.length < limit) {
        return undefined;
      }
      return loaded;
    },
    enabled: !!payload?.householdId,
    refetchOnWindowFocus: false,
  });
};
