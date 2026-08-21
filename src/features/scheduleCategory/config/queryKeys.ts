export const scheduleCategoryQueryKeys = {
  all: ['schedule-categories'] as const,
  list: (householdId: string) =>
    [...scheduleCategoryQueryKeys.all, 'list', householdId] as const,
};
