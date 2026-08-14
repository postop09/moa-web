'use client';

import { useKickHouseholdMember } from '@/features/householdMember';

import { Modal } from './Modal';
import styles from '../settings.module.css';

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
    <Modal title="멤버 추방" onClose={onCancel} closeDisabled={isPending}>
      <div className={styles.modalBody}>
        <p className={styles.confirmText}>
          <strong>{nickname}</strong> 님을 가계부에서 추방할까요?
        </p>
        {error ? (
          <p className={styles.error}>
            {error instanceof Error
              ? error.message
              : '멤버 추방에 실패했습니다.'}
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
            {isPending ? '추방 중…' : '추방'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
