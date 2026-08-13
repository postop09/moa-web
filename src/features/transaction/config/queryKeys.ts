export const transactionQueryKeys = {
  all: ['transactions'] as const,
  list: (householdId: string) =>
    [...transactionQueryKeys.all, 'list', householdId] as const,
  detail: (id: number) => [...transactionQueryKeys.all, 'detail', id] as const,
};
