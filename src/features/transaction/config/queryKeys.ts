export const transactionQueryKeys = {
  all: ['transactions'] as const,
  lists: (householdId: string) =>
    [...transactionQueryKeys.all, 'list', householdId] as const,
  list: (householdId: string, from?: string, to?: string) =>
    [
      ...transactionQueryKeys.lists(householdId),
      from ?? null,
      to ?? null,
    ] as const,
  detail: (id: number) => [...transactionQueryKeys.all, 'detail', id] as const,
};
