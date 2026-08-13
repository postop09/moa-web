'use client';

import { HouseholdPageTitle } from '@/features/household';

import styles from './ui/write.module.css';

export const WritePage = () => {
  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="거래 작성 화면은 곧 여기에 표시됩니다." />
    </main>
  );
};
