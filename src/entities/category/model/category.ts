import type { TransactionType } from '@/shared/model';

export type Category = {
  id: number;
  householdId: string;
  name: string;
  type: TransactionType;
  budget: number | null;
  created_at: string;
};
