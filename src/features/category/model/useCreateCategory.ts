'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCategory, type CreateCategoryReq } from '@/entities/category';
import { createBrowserClient } from '@/shared/api';

import { categoryQueryKeys } from '../config/queryKeys';

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCategoryReq) => {
      const supabase = createBrowserClient();
      return createCategory(supabase, payload);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: categoryQueryKeys.list(variables.householdId),
      });
    },
  });
};
