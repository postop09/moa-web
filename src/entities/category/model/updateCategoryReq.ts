import type { TransactionType } from '@/shared/model';

export type UpdateCategoryReq = {
  id: number;
  name?: string;
  type?: TransactionType;
  budget?: number | null;
  householdId?: string;
};
