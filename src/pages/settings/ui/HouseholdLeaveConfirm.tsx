'use client';

import { useRouter } from 'next/navigation';

import { useListHouseholds } from '@/features/household';
import { useLeaveHousehold } from '@/features/householdMember';
import { ConfirmDialog } from '@/shared/ui';

import { redirectIfNoHouseholds } from '../model/redirectIfNoHouseholds';

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
  const { refetch } = useListHouseholds();

  const handleConfirm = async () => {
    try {
      await mutateAsync(membershipId);
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
