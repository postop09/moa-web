import type { TransactionType } from '@/shared/model';

export type ListTransactionsReq = {
  householdId: string;
  from?: string;
  to?: string;
  type?: TransactionType;
  categoryId?: number;
  limit?: number;
  offset?: number;
};
