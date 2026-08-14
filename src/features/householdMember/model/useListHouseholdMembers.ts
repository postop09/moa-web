'use client';

import { useQuery } from '@tanstack/react-query';

import { listHouseholdMembers } from '@/entities/householdMember';
import { createBrowserClient } from '@/shared/api';

import { householdMemberQueryKeys } from '../config/queryKeys';

export const useListHouseholdMembers = (householdId: string | null) => {
  return useQuery({
    queryKey: householdMemberQueryKeys.list(householdId ?? ''),
    queryFn: async () => {
      if (!householdId) {
        throw new Error('householdId가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return listHouseholdMembers(supabase, householdId);
    },
    enabled: !!householdId,
  });
};
