'use client';

import { useQuery } from '@tanstack/react-query';

import { listCategories } from '@/entities/category';
import { createBrowserClient } from '@/shared/api';

import { categoryQueryKeys } from '../config/queryKeys';

export const useListCategories = (householdId: string | null) => {
  return useQuery({
    queryKey: categoryQueryKeys.list(householdId ?? ''),
    queryFn: async () => {
      if (!householdId) {
        throw new Error('householdId가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return listCategories(supabase, householdId);
    },
    enabled: !!householdId,
  });
};
