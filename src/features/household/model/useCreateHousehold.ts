'use client';

import { useMutation } from '@tanstack/react-query';

import { createHousehold } from '@/entities/household';
import { createBrowserClient } from '@/shared/api';

export const useCreateHousehold = () => {
  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      return createHousehold(supabase, {
        name,
        ownerId: user.id,
      });
    },
  });
};
