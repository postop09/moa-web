'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateCategory, type UpdateCategoryReq } from '@/entities/category';
import { createBrowserClient } from '@/shared/api';

import { categoryQueryKeys } from '../config/queryKeys';

export const useUpdateCategory = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateCategoryReq) => {
      const supabase = createBrowserClient();
      return updateCategory(supabase, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: categoryQueryKeys.list(householdId),
      });
    },
  });
};
