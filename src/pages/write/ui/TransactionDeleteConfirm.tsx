'use client';

import type { Transaction } from '@/entities/transaction';
import { useDeleteTransaction } from '@/features/transaction';

import { Modal } from './Modal';
import styles from './write.module.css';

type Props = {
  householdId: string;
  transaction: Transaction;
  onCancel: () => void;
  onSuccess: () => void;
};

export const TransactionDeleteConfirm = ({
  householdId,
  transaction,
  onCancel,
  onSuccess,
}: Props) => {
  const { mutateAsync, isPending, error } = useDeleteTransaction(householdId);

  const handleConfirm = async () => {
    try {
      await mutateAsync(transaction.id);
      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  const label =
    transaction.name?.trim() ||
    `${transaction.amount.toLocaleString('ko-KR')}원`;

  return (
    <Modal title="내역 삭제" onClose={onCancel} closeDisabled={isPending}>
      <div className={styles.modalBody}>
        <p className={styles.confirmText}>
          <strong>{label}</strong> 내역을 삭제할까요?
        </p>
        {error ? (
          <p className={styles.error}>
            {error instanceof Error
              ? error.message
              : '내역 삭제에 실패했습니다.'}
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
