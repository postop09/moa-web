'use client';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';

import { AccountSection } from './ui/AccountSection';
import { CategorySection } from './ui/CategorySection';
import styles from './settings.module.css';

export const SettingsPage = () => {
  const { householdId } = useCurrentHousehold();

  return (
    <main className={styles.page}>
      <header>
        <HouseholdPageTitle subtitle="가계부와 카테고리를 관리합니다." />
      </header>

      <AccountSection />

      {householdId ? <CategorySection householdId={householdId} /> : null}
    </main>
  );
};
