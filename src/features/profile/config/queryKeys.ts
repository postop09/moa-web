export const profileQueryKeys = {
  all: ['profiles'] as const,
  me: () => [...profileQueryKeys.all, 'me'] as const,
  byIds: (ids: string[]) =>
    [...profileQueryKeys.all, 'byIds', [...ids].sort()] as const,
};
