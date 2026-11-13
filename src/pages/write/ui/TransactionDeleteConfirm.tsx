'use client';

import type { Transaction } from '@/entities/transaction';
import { useDeleteTransaction } from '@/features/transaction';
import { formatAmount } from '@/shared/lib';
import { ConfirmDialog } from '@/shared/ui';

import { useSuccessLock } from '../model/useSuccessLock';

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

  // 삭제 성공 후 화면 이동이 끝나기 전까지 중복 삭제를 막는다 (실패 시에는 잠그지 않는다)
  const { isLocked, runOnce } = useSuccessLock();

  const handleConfirm = () =>
    runOnce(() => mutateAsync(transaction.id), onSuccess);

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
      confirmDisabled={isLocked}
      error={error}
      fallbackError="내역 삭제에 실패했습니다."
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  );
};
