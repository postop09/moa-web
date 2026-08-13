'use client';

import { HouseholdPageTitle } from '@/features/household';

import styles from './ui/home.module.css';

export const HomePage = () => {
  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="가계부 홈은 곧 여기에 표시됩니다." />
    </main>
  );
};
