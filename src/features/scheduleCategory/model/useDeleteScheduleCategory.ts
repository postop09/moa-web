'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteScheduleCategory } from '@/entities/scheduleCategory';
import { createBrowserClient } from '@/shared/api';

import { scheduleCategoryQueryKeys } from '../config/queryKeys';

export const useDeleteScheduleCategory = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = createBrowserClient();
      await deleteScheduleCategory(supabase, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: scheduleCategoryQueryKeys.list(householdId),
      });
      void queryClient.invalidateQueries({
        queryKey: ['schedules'],
      });
    },
  });
};
