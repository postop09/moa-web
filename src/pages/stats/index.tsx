'use client';

import { HouseholdPageTitle } from '@/features/household';

import styles from './ui/stats.module.css';

export const StatsPage = () => {
  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="지출·수입 통계는 곧 여기에 표시됩니다." />
    </main>
  );
};
