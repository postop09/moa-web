'use client';

import { useCurrentHousehold } from '@/features/household';

import { CategorySection } from './ui/CategorySection';
import { HouseholdPicker } from './ui/HouseholdPicker';
import styles from './settings.module.css';

export const SettingsPage = () => {
  const {
    households,
    householdId,
    setHouseholdId,
    isLoading,
    error,
  } = useCurrentHousehold();

  return (
    <main className={styles.page}>
      <header>
        <h1 className={styles.headline}>설정</h1>
        <p className={styles.support}>가계부와 카테고리를 관리합니다.</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>가계부 선택</h2>
        {isLoading ? (
          <p className={styles.empty}>불러오는 중…</p>
        ) : null}
        {error ? (
          <p className={styles.error}>
            {error instanceof Error
              ? error.message
              : '가계부 목록을 불러오지 못했습니다.'}
          </p>
        ) : null}
        {!isLoading && !error ? (
          <HouseholdPicker
            households={households}
            householdId={householdId}
            onChange={setHouseholdId}
          />
        ) : null}
      </section>

      {householdId ? <CategorySection householdId={householdId} /> : null}
    </main>
  );
};
