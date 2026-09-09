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
    queryFn: async () => {
      const user = await getUser(supabase);

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      return user;
    },
    staleTime: Infinity,
  });
};
