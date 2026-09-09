'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getCachedUser } from '@/entities/auth';
import { createProfile } from '@/entities/profile';
import { createBrowserClient } from '@/shared/api';

export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nickname: string) => {
      const supabase = createBrowserClient();
      const user = await getCachedUser(supabase, queryClient);

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      return createProfile(supabase, {
        id: user.id,
        email: user.email ?? '',
        nickname,
      });
    },
  });
};
