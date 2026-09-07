import type { Transaction } from './transaction';

export type ListTransactionsRes = {
  data: Transaction[];
  count: number | null;
};
