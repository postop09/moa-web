'use client';

import type { Category } from '@/entities/category';
import { useDeleteCategory } from '@/features/category';
import { ConfirmDialog } from '@/shared/ui';

type Props = {
  householdId: string;
  category: Category;
  onCancel: () => void;
  onSuccess: () => void;
};

export const CategoryDeleteConfirm = ({
  householdId,
  category,
  onCancel,
  onSuccess,
}: Props) => {
  const { mutateAsync, isPending, error } = useDeleteCategory(householdId);

  const handleConfirm = async () => {
    try {
      await mutateAsync(category.id);
      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <ConfirmDialog
      title="카테고리 삭제"
      message={
        <>
          <strong>{category.name}</strong> 카테고리를 삭제할까요?
        </>
      }
      confirmLabel="삭제"
      pendingLabel="삭제 중…"
      isPending={isPending}
      error={error}
      fallbackError="카테고리 삭제에 실패했습니다."
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  );
};
