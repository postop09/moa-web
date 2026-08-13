export const householdQueryKeys = {
  all: ['households'] as const,
  list: () => [...householdQueryKeys.all, 'list'] as const,
};
