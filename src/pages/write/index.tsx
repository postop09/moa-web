'use client';

import { useRouter } from 'next/navigation';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';

import { TransactionForm } from './ui/TransactionForm';
import styles from './ui/write.module.css';

export const WritePage = () => {
  const router = useRouter();
  const { householdId, isLoading, error } = useCurrentHousehold();

  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="수입·지출 내역을 작성합니다." />

      {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {error ? (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : '가계부 정보를 불러오지 못했습니다.'}
        </p>
      ) : null}

      {!isLoading && !householdId ? (
        <p className={styles.empty}>작성할 가계부를 선택해 주세요.</p>
      ) : null}

      {householdId ? (
        <TransactionForm
          key={`create-${householdId}`}
          householdId={householdId}
          mode={{ type: 'create' }}
          onSuccess={() => router.replace('/')}
        />
      ) : null}
    </main>
  );
};
