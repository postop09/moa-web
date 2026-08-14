'use client';

import { useQuery } from '@tanstack/react-query';

import { listHouseholdInvites } from '@/entities/householdInvite';
import { createBrowserClient } from '@/shared/api';

import { householdMemberQueryKeys } from '../config/queryKeys';

export const useListHouseholdInvites = (
  householdId: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: householdMemberQueryKeys.invites(householdId ?? ''),
    queryFn: async () => {
      if (!householdId) {
        throw new Error('householdId가 필요합니다.');
      }

      const supabase = createBrowserClient();
      return listHouseholdInvites(supabase, householdId);
    },
    enabled: !!householdId && enabled,
  });
};
