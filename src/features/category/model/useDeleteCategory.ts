'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteCategory } from '@/entities/category';
import { createBrowserClient } from '@/shared/api';

import { categoryQueryKeys } from '../config/queryKeys';

const isForeignKeyViolation = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return 'code' in error && error.code === '23503';
};

export const useDeleteCategory = (householdId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = createBrowserClient();

      try {
        await deleteCategory(supabase, id);
      } catch (error) {
        if (isForeignKeyViolation(error)) {
          throw new Error('거래에서 사용 중인 카테고리는 삭제할 수 없습니다.');
        }

        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: categoryQueryKeys.list(householdId),
      });
    },
  });
};
