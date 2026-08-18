'use client';

import { useRouter } from 'next/navigation';

import { useListHouseholds } from '@/features/household';
import { useLeaveHousehold } from '@/features/householdMember';
import { clearAuthGateReadyCookie } from '@/features/onboarding';

import { Modal } from './Modal';
import styles from '../settings.module.css';

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

      if (!result.data?.length) {
        try {
          await clearAuthGateReadyCookie();
        } catch {
          // 온보딩 페이지는 풀 게이트로 상태를 다시 판별함
        }
        router.replace('/onboarding/household');
        return;
      }

      onCancel();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <Modal title="가계부 나가기" onClose={onCancel} closeDisabled={isPending}>
      <div className={styles.modalBody}>
        <p className={styles.confirmText}>
          <strong>{householdName}</strong> 가계부에서 나갈까요?
        </p>
        {error ? (
          <p className={styles.error}>
            {error instanceof Error
              ? error.message
              : '가계부 나가기에 실패했습니다.'}
          </p>
        ) : null}
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
            disabled={isPending}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.dangerPrimaryButton}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? '나가는 중…' : '나가기'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
