'use client';

import { useMutation } from '@tanstack/react-query';

import { createHousehold } from '@/entities/household';
import { createHouseholdMember } from '@/entities/householdMember';
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

      const household = await createHousehold(supabase, {
        name,
        ownerId: user.id,
      });

      await createHouseholdMember(supabase, {
        userId: user.id,
        householdId: household.id,
        role: 'owner',
      });

      return household;
    },
  });
};
