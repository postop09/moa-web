'use client';

import { useQuery } from '@tanstack/react-query';

import { getProfile } from '@/entities/profile';
import { createBrowserClient } from '@/shared/api';

import { profileQueryKeys } from '../config/queryKeys';

export const useGetProfile = () => {
  return useQuery({
    queryKey: profileQueryKeys.me(),
    queryFn: async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
