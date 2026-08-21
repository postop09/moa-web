'use client';

import type { Schedule } from '@/entities/schedule';
import { useDeleteSchedule } from '@/features/schedule';
import { ConfirmDialog } from '@/shared/ui';

type Props = {
  householdId: string;
  schedule: Schedule;
  onCancel: () => void;
  onSuccess: () => void;
};

export const ScheduleDeleteConfirm = ({
  householdId,
  schedule,
  onCancel,
  onSuccess,
}: Props) => {
  const { mutateAsync, isPending, error } = useDeleteSchedule(householdId);

  const handleConfirm = async () => {
    try {
      await mutateAsync(schedule.id);
      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <ConfirmDialog
      title="일정 삭제"
      message={
        <>
          <strong>{schedule.title}</strong> 일정을 삭제할까요?
        </>
      }
      confirmLabel="삭제"
      pendingLabel="삭제 중…"
      isPending={isPending}
      error={error}
      fallbackError="일정 삭제에 실패했습니다."
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  );
};
