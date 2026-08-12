import type { HouseholdRole } from '@/shared/model';

export type UpdateHouseholdMemberReq = {
  id: number;
  role?: HouseholdRole;
  householdId?: string;
  userId?: string;
};
