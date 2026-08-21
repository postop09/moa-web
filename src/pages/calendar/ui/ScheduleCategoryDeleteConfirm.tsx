'use client';

import type { ScheduleCategory } from '@/entities/scheduleCategory';
import { useDeleteScheduleCategory } from '@/features/scheduleCategory';
import { ConfirmDialog } from '@/shared/ui';

type Props = {
  householdId: string;
  category: ScheduleCategory;
  onCancel: () => void;
  onSuccess: () => void;
};

export const ScheduleCategoryDeleteConfirm = ({
  householdId,
  category,
  onCancel,
  onSuccess,
}: Props) => {
  const { mutateAsync, isPending, error } =
    useDeleteScheduleCategory(householdId);

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
          <strong>{category.name}</strong> 카테고리를 삭제할까요? 이 카테고리를
          쓰던 일정은 카테고리가 해제됩니다.
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
