'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSchedule, type CreateScheduleReq } from '@/entities/schedule';
import { createBrowserClient } from '@/shared/api';

import { scheduleQueryKeys } from '../config/queryKeys';

type CreateScheduleInput = Omit<CreateScheduleReq, 'createdBy'>;

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateScheduleInput) => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      return createSchedule(supabase, {
        ...payload,
        createdBy: user.id,
      });
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.lists(data.householdId),
      });
    },
  });
};
