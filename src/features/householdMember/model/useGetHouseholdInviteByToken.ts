'use client';

import { useQuery } from '@tanstack/react-query';

import { getHouseholdInviteByToken } from '@/entities/householdInvite';
import { createBrowserClient } from '@/shared/api';

import { householdMemberQueryKeys } from '../config/queryKeys';

export const useGetHouseholdInviteByToken = (token: string) => {
  return useQuery({
    queryKey: householdMemberQueryKeys.inviteByToken(token),
    queryFn: async () => {
      const supabase = createBrowserClient();
      return getHouseholdInviteByToken(supabase, token);
    },
    enabled: token.length > 0,
  });
};
