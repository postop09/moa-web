import type { TransactionType } from '@/shared/model';

export type Transaction = {
  id: number;
  householdId: string;
  type: TransactionType;
  name: string | null;
  amount: number;
  isRecurring: boolean | null;
  recurringDay: number | null;
  recurringSourceId: number | null;
  categoryId: number | null;
  memo: string | null;
  createdBy: string;
  createdDt: string;
  updatedDt: string;
  transactionDt: string;
};
