'use client';

import { useQuery } from '@tanstack/react-query';

import { listHouseholds } from '@/entities/household';
import { createBrowserClient } from '@/shared/api';

import { householdQueryKeys } from '../config/queryKeys';

export const useListHouseholds = () => {
  return useQuery({
    queryKey: householdQueryKeys.list(),
    queryFn: async () => {
      const supabase = createBrowserClient();
      return listHouseholds(supabase);
    },
  });
};
