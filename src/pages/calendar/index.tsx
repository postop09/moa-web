'use client';

import { HouseholdPageTitle } from '@/features/household';

import styles from './ui/calendar.module.css';

export const CalendarPage = () => {
  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="달력 보기는 곧 여기에 표시됩니다." />
    </main>
  );
};
