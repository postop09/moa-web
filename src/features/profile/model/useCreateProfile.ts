'use client';

import { useMutation } from '@tanstack/react-query';

import { createProfile } from '@/entities/profile';
import { createBrowserClient } from '@/shared/api';

export const useCreateProfile = () => {
  return useMutation({
    mutationFn: async (nickname: string) => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
