import type { TransactionType } from '@/shared/model';

export type CreateCategoryReq = {
  householdId: string;
  name: string;
  type: TransactionType;
  budget?: number | null;
};
