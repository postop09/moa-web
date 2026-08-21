'use client';

import { useQuery } from '@tanstack/react-query';

import { listSchedules, type ListSchedulesReq } from '@/entities/schedule';
import { createBrowserClient } from '@/shared/api';

import { scheduleQueryKeys } from '../config/queryKeys';

export const useListSchedules = (payload: ListSchedulesReq | null) => {
  const householdId = payload?.householdId ?? '';
  const from = payload?.from;
  const to = payload?.to;

  return useQuery({
    queryKey: scheduleQueryKeys.list(householdId, from, to),
    queryFn: async () => {
      if (!payload?.householdId) {
        throw new Error('householdId가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return listSchedules(supabase, payload);
    },
    enabled: !!payload?.householdId,
  });
};
