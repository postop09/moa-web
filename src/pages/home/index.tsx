'use client';

import {
  HouseholdGuard,
  HouseholdPageTitle,
  useCurrentHousehold,
} from '@/features/household';

import { useSelectedMonth } from './model/useSelectedMonth';
import { DashboardSection } from './ui/DashboardSection';
import { MonthNavigator } from './ui/MonthNavigator';
import styles from './ui/home.module.css';

export const HomePage = () => {
  const { householdId } = useCurrentHousehold();
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

      <HouseholdGuard>
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
