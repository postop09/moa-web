'use client';

import { useRouter } from 'next/navigation';

import { useDeleteHousehold, useListHouseholds } from '@/features/household';
import { ConfirmDialog } from '@/shared/ui';

import { redirectIfNoHouseholds } from '../model/redirectIfNoHouseholds';

type Props = {
  householdId: string;
  householdName: string;
  onCancel: () => void;
};

export const HouseholdDeleteConfirm = ({
  householdId,
  householdName,
  onCancel,
}: Props) => {
  const router = useRouter();
  const { mutateAsync, isPending, error } = useDeleteHousehold();
  const { refetch } = useListHouseholds();

  const handleConfirm = async () => {
    try {
      await mutateAsync(householdId);
      const result = await refetch();
      const redirected = await redirectIfNoHouseholds(result.data, router);

      if (!redirected) {
        onCancel();
      }
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <ConfirmDialog
      title="가계부 삭제"
      message={
        <>
          <strong>{householdName}</strong> 가계부를 삭제할까요? 거래와
          카테고리가 함께 삭제되며 되돌릴 수 없습니다.
        </>
      }
      confirmLabel="삭제"
      pendingLabel="삭제 중…"
      isPending={isPending}
      error={error}
      fallbackError="가계부 삭제에 실패했습니다."
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  );
};
