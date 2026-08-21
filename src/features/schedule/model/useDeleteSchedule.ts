'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteSchedule } from '@/entities/schedule';
import { createBrowserClient } from '@/shared/api';

import { scheduleQueryKeys } from '../config/queryKeys';

export const useDeleteSchedule = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = createBrowserClient();
      await deleteSchedule(supabase, id);
      return id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.lists(householdId),
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.detail(id),
      });
    },
  });
};
