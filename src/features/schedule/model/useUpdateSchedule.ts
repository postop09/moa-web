'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateSchedule, type UpdateScheduleReq } from '@/entities/schedule';
import { createBrowserClient } from '@/shared/api';

import { scheduleQueryKeys } from '../config/queryKeys';

export const useUpdateSchedule = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateScheduleReq) => {
      const supabase = createBrowserClient();
      return updateSchedule(supabase, payload);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.lists(householdId),
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.detail(data.id),
      });
    },
  });
};
