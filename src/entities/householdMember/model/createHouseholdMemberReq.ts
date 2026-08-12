import type { HouseholdRole } from '@/shared/model';

export type CreateHouseholdMemberReq = {
  userId: string;
  householdId: string;
  role: HouseholdRole;
};
