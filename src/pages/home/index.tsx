'use client';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';

import { DashboardSection } from './ui/DashboardSection';
import styles from './ui/home.module.css';

export const HomePage = () => {
  const { householdId, isLoading, error } = useCurrentHousehold();

  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="지출 분석" />

      {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {error ? (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : '가계부 정보를 불러오지 못했습니다.'}
        </p>
      ) : null}

      {!isLoading && !householdId ? (
        <p className={styles.empty}>확인할 가계부를 선택해 주세요.</p>
      ) : null}

      {householdId ? <DashboardSection householdId={householdId} /> : null}
    </main>
  );
};
