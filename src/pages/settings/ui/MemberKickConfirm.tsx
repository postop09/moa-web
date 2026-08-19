'use client';

import { useKickHouseholdMember } from '@/features/householdMember';
import { ConfirmDialog } from '@/shared/ui';

type Props = {
  householdId: string;
  memberId: number;
  nickname: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export const MemberKickConfirm = ({
  householdId,
  memberId,
  nickname,
  onCancel,
  onSuccess,
}: Props) => {
  const { mutateAsync, isPending, error } = useKickHouseholdMember(householdId);

  const handleConfirm = async () => {
    try {
      await mutateAsync(memberId);
      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <ConfirmDialog
      title="멤버 추방"
      message={
        <>
          <strong>{nickname}</strong> 님을 가계부에서 추방할까요?
        </>
      }
      confirmLabel="추방"
      pendingLabel="추방 중…"
      isPending={isPending}
      error={error}
      fallbackError="멤버 추방에 실패했습니다."
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  );
};
