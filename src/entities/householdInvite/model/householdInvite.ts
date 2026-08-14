import type { HouseholdInviteStatus } from './householdInviteStatus';

export type HouseholdInvite = {
  id: string;
  householdId: string;
  email: string;
  token: string;
  invitedBy: string;
  status: HouseholdInviteStatus;
  createdAt: string;
  acceptedAt: string | null;
};
