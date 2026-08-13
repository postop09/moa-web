'use client';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';

import { useSelectedMonth } from './model/useSelectedMonth';
import { DashboardSection } from './ui/DashboardSection';
import { MonthNavigator } from './ui/MonthNavigator';
import styles from './ui/home.module.css';

export const HomePage = () => {
  const { householdId, isLoading, error } = useCurrentHousehold();
  const { selectedMonth, canGoNext, goPrevMonth, goNextMonth } =
    useSelectedMonth();

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <HouseholdPageTitle subtitle="지출 분석" />
        {householdId ? (
          <MonthNavigator
            value={selectedMonth}
            onPrev={goPrevMonth}
            onNext={goNextMonth}
            canGoNext={canGoNext}
          />
        ) : null}
      </div>

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

      {householdId ? (
        <DashboardSection
          householdId={householdId}
          selectedMonth={selectedMonth}
        />
      ) : null}
    </main>
  );
};
