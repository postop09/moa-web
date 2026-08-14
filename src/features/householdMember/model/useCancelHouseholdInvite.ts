'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelHouseholdInvite } from '@/entities/householdInvite';
import { createBrowserClient } from '@/shared/api';

import { householdMemberQueryKeys } from '../config/queryKeys';

export const useCancelHouseholdInvite = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createBrowserClient();
      await cancelHouseholdInvite(supabase, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: householdMemberQueryKeys.invites(householdId),
      });
    },
  });
};
