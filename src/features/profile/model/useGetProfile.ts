'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getCachedUser } from '@/entities/auth';
import { getProfile } from '@/entities/profile';
import { createBrowserClient } from '@/shared/api';

import { profileQueryKeys } from '../config/queryKeys';

export const useGetProfile = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: profileQueryKeys.me(),
    queryFn: async () => {
      const supabase = createBrowserClient();
      const user = await getCachedUser(supabase, queryClient);

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const profile = await getProfile(supabase, user.id);

      if (!profile) {
        throw new Error('프로필을 찾을 수 없습니다.');
      }

      return profile;
    },
  });
};
