'use client';

import { useQuery } from '@tanstack/react-query';

import { listScheduleCategories } from '@/entities/scheduleCategory';
import { createBrowserClient } from '@/shared/api';

import { scheduleCategoryQueryKeys } from '../config/queryKeys';

export const useListScheduleCategories = (householdId: string | null) => {
  return useQuery({
    queryKey: scheduleCategoryQueryKeys.list(householdId ?? ''),
    queryFn: async () => {
      if (!householdId) {
        throw new Error('householdId가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return listScheduleCategories(supabase, householdId);
    },
    enabled: !!householdId,
  });
};
