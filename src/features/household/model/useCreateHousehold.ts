'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createHousehold, type ListHouseholdsRes } from '@/entities/household';
import { createBrowserClient } from '@/shared/api';

import { householdQueryKeys } from '../config/queryKeys';

export const useCreateHousehold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      return createHousehold(supabase, {
        name,
        ownerId: user.id,
      });
    },
    onSuccess: (household) => {
      queryClient.setQueryData<ListHouseholdsRes>(
        householdQueryKeys.list(),
        (current) => {
          if (!current) {
            return [household];
          }

          if (current.some((item) => item.id === household.id)) {
            return current;
          }

          return [...current, household];
        },
      );
      void queryClient.invalidateQueries({
        queryKey: householdQueryKeys.list(),
      });
    },
  });
};
