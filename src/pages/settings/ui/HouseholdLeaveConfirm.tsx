'use client';

import { useRouter } from 'next/navigation';

import { useCurrentHousehold, useListHouseholds } from '@/features/household';
import { useLeaveHousehold } from '@/features/householdMember';
import { redirectIfNoHouseholds } from '@/features/onboarding';
import { ConfirmDialog } from '@/shared/ui';

type Props = {
  householdId: string;
  householdName: string;
  membershipId: number;
  onCancel: () => void;
};

export const HouseholdLeaveConfirm = ({
  householdId,
  householdName,
  membershipId,
  onCancel,
}: Props) => {
  const router = useRouter();
  const { mutateAsync, isPending, error } = useLeaveHousehold(householdId);
  const { householdId: currentHouseholdId, setHouseholdId } =
    useCurrentHousehold();
  const { refetch } = useListHouseholds();

  const handleConfirm = async () => {
    try {
      await mutateAsync(membershipId);
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
      title="가계부 나가기"
      message={
        <>
          <strong>{householdName}</strong> 가계부에서 나갈까요?
        </>
      }
      confirmLabel="나가기"
      pendingLabel="나가는 중…"
      isPending={isPending}
      error={error}
      fallbackError="가계부 나가기에 실패했습니다."
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  );
};
