'use client';

import { useQuery } from '@tanstack/react-query';

import { listProfilesByIds } from '@/entities/profile';
import { createBrowserClient } from '@/shared/api';

import { profileQueryKeys } from '../config/queryKeys';

export const useListProfilesByIds = (ids: string[]) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  return useQuery({
    queryKey: profileQueryKeys.byIds(uniqueIds),
    queryFn: async () => {
      const supabase = createBrowserClient();
      return listProfilesByIds(supabase, uniqueIds);
    },
    enabled: uniqueIds.length > 0,
  });
};
