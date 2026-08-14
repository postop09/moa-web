'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteHousehold } from '@/entities/household';
import { createBrowserClient } from '@/shared/api';

import { householdQueryKeys } from '../config/queryKeys';

export const useDeleteHousehold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (householdId: string) => {
      const supabase = createBrowserClient();
      await deleteHousehold(supabase, householdId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: householdQueryKeys.list(),
      });
    },
  });
};
