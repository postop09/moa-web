'use client';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';

import { CategorySection } from './ui/CategorySection';
import styles from './settings.module.css';

export const SettingsPage = () => {
  const { householdId } = useCurrentHousehold();

  return (
    <main className={styles.page}>
      <header>
        <HouseholdPageTitle subtitle="가계부와 카테고리를 관리합니다." />
      </header>

      {householdId ? <CategorySection householdId={householdId} /> : null}
    </main>
  );
};
