export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'currentUser'] as const,
};
