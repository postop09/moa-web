'use client';

import type { Transaction } from '@/entities/transaction';
import { useDeleteTransaction } from '@/features/transaction';
import { formatAmount } from '@/shared/lib';
import { ConfirmDialog } from '@/shared/ui';

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

  const label = transaction.name?.trim() || formatAmount(transaction.amount);

  return (
    <ConfirmDialog
      title="내역 삭제"
      message={
        <>
          <strong>{label}</strong> 내역을 삭제할까요?
        </>
      }
      confirmLabel="삭제"
      pendingLabel="삭제 중…"
      isPending={isPending}
      error={error}
      fallbackError="내역 삭제에 실패했습니다."
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  );
};
