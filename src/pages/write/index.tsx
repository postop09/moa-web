'use client';

import { useRouter } from 'next/navigation';

import { HouseholdGuard } from '@/features/household';

import { TransactionForm } from './ui/TransactionForm';
import styles from './ui/write.module.css';

export const WritePage = () => {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <h2 className={styles.title}>추가하기</h2>

      <HouseholdGuard emptyMessage="작성할 가계부를 선택해 주세요.">
        {(householdId) => (
          <TransactionForm
            householdId={householdId}
            mode={{ type: 'create' }}
            onSuccess={() => router.replace('/')}
          />
        )}
      </HouseholdGuard>
    </main>
  );
};
