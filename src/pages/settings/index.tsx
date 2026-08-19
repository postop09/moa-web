'use client';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';
import { useGetProfile } from '@/features/profile';

import { AccountSection } from './ui/AccountSection';
import { CategorySection } from './ui/CategorySection';
import { HouseholdDangerSection } from './ui/HouseholdDangerSection';
import { MembersSection } from './ui/MembersSection';
import styles from './settings.module.css';

export const SettingsPage = () => {
  const { household, householdId } = useCurrentHousehold();
  const { data: profile } = useGetProfile();
  const isOwner = Boolean(
    household && profile && household.ownerId === profile.id,
  );

  return (
    <main className={styles.page}>
      <header>
        <HouseholdPageTitle subtitle="가계부와 멤버, 카테고리를 관리합니다." />
      </header>

      <AccountSection />

      {householdId && profile ? (
        <MembersSection
          key={householdId}
          householdId={householdId}
          isOwner={isOwner}
          currentUserId={profile.id}
          currentUserEmail={profile.email}
        />
      ) : null}

      {householdId ? (
        <CategorySection key={householdId} householdId={householdId} />
      ) : null}

      {household && profile ? (
        <HouseholdDangerSection
          key={`danger-${household.id}`}
          householdId={household.id}
          householdName={household.name}
          isOwner={isOwner}
          currentUserId={profile.id}
        />
      ) : null}
    </main>
  );
};
