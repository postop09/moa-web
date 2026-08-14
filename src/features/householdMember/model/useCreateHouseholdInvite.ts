'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createHouseholdInvite } from '@/entities/householdInvite';
import { createBrowserClient } from '@/shared/api';

import { householdMemberQueryKeys } from '../config/queryKeys';

export const useCreateHouseholdInvite = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      return createHouseholdInvite(supabase, {
        householdId,
        email,
        invitedBy: user.id,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: householdMemberQueryKeys.invites(householdId),
      });
    },
  });
};
