'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  updateScheduleCategory,
  type UpdateScheduleCategoryReq,
} from '@/entities/scheduleCategory';
import { createBrowserClient } from '@/shared/api';

import { scheduleCategoryQueryKeys } from '../config/queryKeys';

export const useUpdateScheduleCategory = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateScheduleCategoryReq) => {
      const supabase = createBrowserClient();
      return updateScheduleCategory(supabase, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: scheduleCategoryQueryKeys.list(householdId),
      });
    },
  });
};
