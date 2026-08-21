export const scheduleQueryKeys = {
  all: ['schedules'] as const,
  lists: (householdId: string) =>
    [...scheduleQueryKeys.all, 'list', householdId] as const,
  list: (householdId: string, from?: string, to?: string) =>
    [
      ...scheduleQueryKeys.lists(householdId),
      from ?? null,
      to ?? null,
    ] as const,
  detail: (id: number) => [...scheduleQueryKeys.all, 'detail', id] as const,
};
