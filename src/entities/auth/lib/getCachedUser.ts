import type { QueryClient } from '@tanstack/react-query';

import type { SupabaseClient } from '@/shared/api';

import { getUser } from '../api/getUser';
import { authQueryKeys } from '../config/queryKeys';

export const getCachedUser = (
  supabase: SupabaseClient,
  queryClient: QueryClient,
) => {
  return queryClient.fetchQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: () => getUser(supabase),
    staleTime: Infinity,
  });
};
