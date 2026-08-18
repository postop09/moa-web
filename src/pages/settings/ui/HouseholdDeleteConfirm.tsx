'use client';

import { useRouter } from 'next/navigation';

import { useDeleteHousehold, useListHouseholds } from '@/features/household';
import { clearAuthGateReadyCookie } from '@/features/onboarding';

import { Modal } from './Modal';
import styles from '../settings.module.css';

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
    <Modal title="가계부 삭제" onClose={onCancel} closeDisabled={isPending}>
      <div className={styles.modalBody}>
        <p className={styles.confirmText}>
          <strong>{householdName}</strong> 가계부를 삭제할까요? 거래와
          카테고리가 함께 삭제되며 되돌릴 수 없습니다.
        </p>
        {error ? (
          <p className={styles.error}>
            {error instanceof Error
              ? error.message
              : '가계부 삭제에 실패했습니다.'}
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
            {isPending ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
