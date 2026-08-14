'use client';

import { useCallback, useState } from 'react';

import { useListHouseholdMembers } from '@/features/householdMember';

import { HouseholdDeleteConfirm } from './HouseholdDeleteConfirm';
import { HouseholdLeaveConfirm } from './HouseholdLeaveConfirm';
import styles from '../settings.module.css';

type Panel = { type: 'idle' } | { type: 'delete' } | { type: 'leave' };

type Props = {
  householdId: string;
  householdName: string;
  isOwner: boolean;
  currentUserId: string;
};

export const HouseholdDangerSection = ({
  householdId,
  householdName,
  isOwner,
  currentUserId,
}: Props) => {
  const membersQuery = useListHouseholdMembers(householdId);
  const [panel, setPanel] = useState<Panel>({ type: 'idle' });

  const closePanel = useCallback(() => {
    setPanel({ type: 'idle' });
  }, []);

  const membershipId = membersQuery.data?.find(
    (member) => member.userId === currentUserId,
  )?.id;

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>가계부</h2>
      </header>

      {panel.type === 'delete' ? (
        <HouseholdDeleteConfirm
          householdId={householdId}
          householdName={householdName}
          onCancel={closePanel}
        />
      ) : null}

      {panel.type === 'leave' && membershipId !== undefined ? (
        <HouseholdLeaveConfirm
          householdId={householdId}
          householdName={householdName}
          membershipId={membershipId}
          onCancel={closePanel}
        />
      ) : null}

      <div className={styles.dangerCard}>
        {isOwner ? (
          <>
            <div>
              <h3 className={styles.dangerTitle}>가계부 삭제</h3>
              <p className={styles.dangerSupport}>
                가계부와 거래, 카테고리가 모두 삭제됩니다.
              </p>
            </div>
            <button
              type="button"
              className={styles.dangerPrimaryButton}
              onClick={() => setPanel({ type: 'delete' })}
            >
              가계부 삭제
            </button>
          </>
        ) : (
          <>
            <div>
              <h3 className={styles.dangerTitle}>가계부 나가기</h3>
              <p className={styles.dangerSupport}>
                이 가계부에서 나가고 더 이상 내역을 볼 수 없습니다.
              </p>
            </div>
            <button
              type="button"
              className={styles.dangerPrimaryButton}
              onClick={() => setPanel({ type: 'leave' })}
              disabled={membershipId === undefined}
            >
              가계부 나가기
            </button>
          </>
        )}
      </div>
    </section>
  );
};
