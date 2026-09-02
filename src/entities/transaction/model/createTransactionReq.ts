import type { TransactionType } from '@/shared/model';

export type CreateTransactionReq = {
  householdId: string;
  type: TransactionType;
  amount: number;
  createdBy: string;
  transactionDt: string;
  name?: string | null;
  categoryId?: number | null;
  memo?: string | null;
  isRecurring?: boolean | null;
  recurringDay?: number | null;
};
