import type { TransactionType } from '@/shared/model';

export type InfiniteListParams = {
  from?: string;
  to?: string;
  type?: TransactionType | 'all';
  categoryId?: number | 'all';
  limit: number;
};

export const transactionQueryKeys = {
  all: ['transactions'] as const,
  lists: (householdId: string) =>
    [...transactionQueryKeys.all, 'list', householdId] as const,
  list: (householdId: string, from?: string, to?: string) =>
    [
      ...transactionQueryKeys.lists(householdId),
      from ?? null,
      to ?? null,
    ] as const,
  infiniteList: (householdId: string, params: InfiniteListParams) =>
    [
      ...transactionQueryKeys.lists(householdId),
      'infinite',
      params.from ?? null,
      params.to ?? null,
      params.type ?? 'all',
      params.categoryId ?? 'all',
      params.limit,
    ] as const,
  detail: (id: number) => [...transactionQueryKeys.all, 'detail', id] as const,
};
