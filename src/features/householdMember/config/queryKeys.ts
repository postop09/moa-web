export const householdMemberQueryKeys = {
  all: ['household-members'] as const,
  list: (householdId: string) =>
    [...householdMemberQueryKeys.all, 'list', householdId] as const,
  invites: (householdId: string) =>
    [...householdMemberQueryKeys.all, 'invites', householdId] as const,
  inviteByToken: (token: string) =>
    [...householdMemberQueryKeys.all, 'invite', token] as const,
};
