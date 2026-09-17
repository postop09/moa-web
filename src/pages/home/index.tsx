'use client';

import { useEffect } from 'react';

import {
  HouseholdGuard,
  HouseholdPageTitle,
  useCurrentHousehold,
} from '@/features/household';

import { useSelectedMonth } from './model/useSelectedMonth';
import { warmDashboardChunks } from './ui/dashboardChunks';
import { DashboardSection } from './ui/DashboardSection';
import { DashboardSkeleton } from './ui/DashboardSkeleton';
import { MonthNavigator } from './ui/MonthNavigator';
import styles from './ui/home.module.css';

export const HomePage = () => {
  const { householdId } = useCurrentHousehold();
  const { selectedMonth, canGoNext, goPrevMonth, goNextMonth } =
    useSelectedMonth();

  // 가드 바깥에서 워밍해 가계부 조회·대시보드 데이터 요청과 카드 청크 로드가 병렬로 진행되게 한다.
  useEffect(() => {
    void warmDashboardChunks();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <HouseholdPageTitle subtitle="지출 분석" />
        <MonthNavigator
          value={selectedMonth}
          onPrev={goPrevMonth}
          onNext={goNextMonth}
          canGoNext={canGoNext}
          disabled={!householdId}
        />
      </div>

      <HouseholdGuard fallback={<DashboardSkeleton />}>
        {(householdId) => (
          <DashboardSection
            householdId={householdId}
            selectedMonth={selectedMonth}
          />
        )}
      </HouseholdGuard>
    </main>
  );
};
