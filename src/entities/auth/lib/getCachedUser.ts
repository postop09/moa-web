import type { QueryClient } from '@tanstack/react-query';

import type { SupabaseClient } from '@/shared/api';

import { getUser } from '../api/getUser';
import { authQueryKeys } from '../config/queryKeys';

// 다른 탭에서 로그아웃하거나 세션이 만료돼도 이 탭에는 이를 알려줄 구독이 없으므로,
// 무한 캐싱 대신 유효 시간을 둬서 그런 경우 최대 이 시간 이후에는 다시 검증하게 한다.
const CURRENT_USER_STALE_TIME = 5 * 60 * 1000;

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
    staleTime: CURRENT_USER_STALE_TIME,
  });
};
