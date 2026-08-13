'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';
import { useGetTransaction } from '@/features/transaction';

import { TransactionDeleteConfirm } from '../ui/TransactionDeleteConfirm';
import { TransactionForm } from '../ui/TransactionForm';
import styles from '../ui/write.module.css';

type Props = {
  transactionId: number;
};

export const WriteEditPage = ({ transactionId }: Props) => {
  const router = useRouter();
  const { householdId, isLoading: isHouseholdLoading } = useCurrentHousehold();
  const {
    data: transaction,
    isLoading: isTransactionLoading,
    error,
  } = useGetTransaction(transactionId);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isLoading = isHouseholdLoading || isTransactionLoading;
  const isHouseholdMismatch =
    !!transaction && !!householdId && transaction.householdId !== householdId;

  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="내역을 수정합니다." />

      {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {error ? (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : '내역을 불러오지 못했습니다.'}
        </p>
      ) : null}

      {!isLoading && !householdId ? (
        <p className={styles.empty}>수정할 가계부를 선택해 주세요.</p>
      ) : null}

      {isHouseholdMismatch ? (
        <p className={styles.error}>
          선택한 가계부와 다른 내역입니다. 가계부를 확인해 주세요.
        </p>
      ) : null}

      {householdId && transaction && !isHouseholdMismatch ? (
        <>
          <TransactionForm
            key={`edit-${transaction.id}-${householdId}`}
            householdId={householdId}
            mode={{ type: 'edit', transaction }}
            onSuccess={() => router.replace('/')}
          />
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => setIsDeleteOpen(true)}
          >
            삭제
          </button>
          {isDeleteOpen ? (
            <TransactionDeleteConfirm
              householdId={householdId}
              transaction={transaction}
              onCancel={() => setIsDeleteOpen(false)}
              onSuccess={() => router.replace('/')}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
};
