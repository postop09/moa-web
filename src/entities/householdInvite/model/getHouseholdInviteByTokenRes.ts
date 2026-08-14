import type { HouseholdInviteStatus } from './householdInviteStatus';

export type GetHouseholdInviteByTokenRes = {
  id: string;
  householdId: string;
  householdName: string;
  email: string;
  status: HouseholdInviteStatus;
  createdAt: string;
};
