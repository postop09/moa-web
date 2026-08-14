'use client';

import type { HouseholdInvite } from '@/entities/householdInvite';
import type { HouseholdMember } from '@/entities/householdMember';
import type { Profile } from '@/entities/profile';
import { HOUSEHOLD_ROLE_LABEL } from '@/shared/model';

import styles from '../settings.module.css';

type Props = {
  members: HouseholdMember[];
  profilesById: Map<string, Profile>;
  currentUserId: string;
  isOwner: boolean;
  pendingInvites: HouseholdInvite[];
  cancellingInviteId: string | null;
  onKick: (member: HouseholdMember) => void;
  onCancelInvite: (invite: HouseholdInvite) => void;
};

export const MemberList = ({
  members,
  profilesById,
  currentUserId,
  isOwner,
  pendingInvites,
  cancellingInviteId,
  onKick,
  onCancelInvite,
}: Props) => {
  if (members.length === 0 && pendingInvites.length === 0) {
    return <p className={styles.empty}>참여 중인 멤버가 없습니다.</p>;
  }

  return (
    <div className={styles.list}>
      <section className={styles.group}>
        <ul className={styles.groupList}>
          {members.map((member) => {
            const profile = profilesById.get(member.userId);
            const canKick =
              isOwner &&
              member.role !== 'owner' &&
              member.userId !== currentUserId;

            return (
              <li key={member.id} className={styles.row}>
                <div className={styles.rowBody}>
                  <span className={styles.rowName}>
                    {profile?.nickname ?? '이름 없음'}
                    {member.userId === currentUserId ? ' (나)' : ''}
                  </span>
                  <span className={styles.rowMeta}>
                    {profile?.email ?? member.userId}
                  </span>
                </div>
                <div className={styles.rowActions}>
                  <span className={styles.roleBadge}>
                    {HOUSEHOLD_ROLE_LABEL[member.role]}
                  </span>
                  {canKick ? (
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => onKick(member)}
                    >
                      추방
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {isOwner && pendingInvites.length > 0 ? (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>초대 대기</h3>
          <ul className={styles.groupList}>
            {pendingInvites.map((invite) => {
              const isCancelling = cancellingInviteId === invite.id;

              return (
                <li key={invite.id} className={styles.row}>
                  <div className={styles.rowBody}>
                    <span className={styles.rowName}>{invite.email}</span>
                    <span className={styles.rowMeta}>수락 대기 중</span>
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => onCancelInvite(invite)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? '취소 중…' : '취소'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
};
