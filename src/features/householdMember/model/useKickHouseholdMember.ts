'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteHouseholdMember } from '@/entities/householdMember';
import { createBrowserClient } from '@/shared/api';

import { householdMemberQueryKeys } from '../config/queryKeys';

export const useKickHouseholdMember = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = createBrowserClient();
      await deleteHouseholdMember(supabase, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: householdMemberQueryKeys.list(householdId),
      });
    },
  });
};
