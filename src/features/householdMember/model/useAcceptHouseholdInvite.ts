'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { acceptHouseholdInvite } from '@/entities/householdInvite';
import { createBrowserClient } from '@/shared/api';

import { householdMemberQueryKeys } from '../config/queryKeys';

export const useAcceptHouseholdInvite = (token: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = createBrowserClient();
      await acceptHouseholdInvite(supabase, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['households'] });
      void queryClient.invalidateQueries({
        queryKey: householdMemberQueryKeys.inviteByToken(token),
      });
    },
  });
};
