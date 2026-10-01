'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getCachedUser } from '@/entities/auth';
import { getUnreadReplyCount } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { inquiryQueryKeys } from '../config/queryKeys';

/** 미확인 답변이 있는 내 문의 수. 로그인 사용자가 없으면 0. */
export const useUnreadReplyCount = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: inquiryQueryKeys.unreadCount(),
    queryFn: async () => {
      const supabase = createBrowserClient();
      const user = await getCachedUser(supabase, queryClient);

      if (!user) return 0;

      return getUnreadReplyCount(supabase, user.id);
    },
  });
};
