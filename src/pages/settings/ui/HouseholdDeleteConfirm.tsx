'use client';

import { useRouter } from 'next/navigation';

import {
  useCurrentHousehold,
  useDeleteHousehold,
  useListHouseholds,
} from '@/features/household';
import { redirectIfNoHouseholds } from '@/features/onboarding';
import { ConfirmDialog } from '@/shared/ui';

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
  const { householdId: currentHouseholdId, setHouseholdId } =
    useCurrentHousehold();
  const { refetch } = useListHouseholds();

  const handleConfirm = async () => {
    try {
      await mutateAsync(householdId);
      const result = await refetch();
      const remaining = result.data ?? [];
      const redirected = await redirectIfNoHouseholds(remaining, router);

      if (!redirected) {
        if (currentHouseholdId === householdId) {
          const nextHousehold = remaining.find(
            (item) => item.id !== householdId,
          );
          if (nextHousehold) {
            setHouseholdId(nextHousehold.id);
          }
        }
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
