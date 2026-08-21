'use client';

import { useQuery } from '@tanstack/react-query';

import { getSchedule } from '@/entities/schedule';
import { createBrowserClient } from '@/shared/api';

import { scheduleQueryKeys } from '../config/queryKeys';

export const useGetSchedule = (id: number | null) => {
  return useQuery({
    queryKey: scheduleQueryKeys.detail(id ?? 0),
    queryFn: async () => {
      if (id === null || !Number.isFinite(id)) {
        throw new Error('일정 ID가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return getSchedule(supabase, id);
    },
    enabled: id !== null && Number.isFinite(id),
  });
};
