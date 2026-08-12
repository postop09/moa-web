import type { HouseholdRole } from '@/shared/model';

export type HouseholdMember = {
  id: number;
  userId: string;
  householdId: string;
  role: HouseholdRole;
  joinedAt: string;
};
