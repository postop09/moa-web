'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createScheduleCategory,
  type CreateScheduleCategoryReq,
} from '@/entities/scheduleCategory';
import { createBrowserClient } from '@/shared/api';

import { scheduleCategoryQueryKeys } from '../config/queryKeys';

export const useCreateScheduleCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateScheduleCategoryReq) => {
      const supabase = createBrowserClient();
      return createScheduleCategory(supabase, payload);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleCategoryQueryKeys.list(variables.householdId),
      });
    },
  });
};
