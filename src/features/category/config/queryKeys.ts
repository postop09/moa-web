export const categoryQueryKeys = {
  all: ['categories'] as const,
  list: (householdId: string) =>
    [...categoryQueryKeys.all, 'list', householdId] as const,
};
