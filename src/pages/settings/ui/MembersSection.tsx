'use client';

import { useCallback, useState } from 'react';

import type { HouseholdMember } from '@/entities/householdMember';
import {
  useCancelHouseholdInvite,
  useListHouseholdInvites,
  useListHouseholdMembers,
} from '@/features/householdMember';
import { useListProfilesByIds } from '@/features/profile';

import { MemberInviteForm } from './MemberInviteForm';
import { MemberKickConfirm } from './MemberKickConfirm';
import { MemberList } from './MemberList';
import styles from '../settings.module.css';

type Panel =
  | { type: 'idle' }
  | { type: 'invite' }
  | { type: 'kick'; member: HouseholdMember; nickname: string };

type Props = {
  householdId: string;
  isOwner: boolean;
  currentUserId: string;
  currentUserEmail: string;
};

export const MembersSection = ({
  householdId,
  isOwner,
  currentUserId,
  currentUserEmail,
}: Props) => {
  const membersQuery = useListHouseholdMembers(householdId);
  const invitesQuery = useListHouseholdInvites(householdId, isOwner);
  const cancelInvite = useCancelHouseholdInvite(householdId);
  const [panel, setPanel] = useState<Panel>({ type: 'idle' });
  const [cancelError, setCancelError] = useState<string | null>(null);

  const closePanel = useCallback(() => {
    setPanel({ type: 'idle' });
  }, []);

  const members = membersQuery.data ?? [];
  const memberIds = members.map((member) => member.userId);
  const profilesQuery = useListProfilesByIds(memberIds);
  const profilesById = new Map(
    (profilesQuery.data ?? []).map((profile) => [profile.id, profile]),
  );
  const memberEmails = (profilesQuery.data ?? []).map(
    (profile) => profile.email,
  );
  const pendingInvites = invitesQuery.data ?? [];

  const handleCancelInvite = async (id: string) => {
    setCancelError(null);

    try {
      await cancelInvite.mutateAsync(id);
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : '초대 취소에 실패했습니다.',
      );
    }
  };

  const isLoading =
    membersQuery.isLoading || (isOwner && invitesQuery.isLoading);
  const error = membersQuery.error ?? invitesQuery.error ?? profilesQuery.error;

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>멤버</h2>
        {isOwner ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setPanel({ type: 'invite' })}
          >
            초대
          </button>
        ) : null}
      </header>

      {panel.type === 'invite' ? (
        <MemberInviteForm
          householdId={householdId}
          currentUserEmail={currentUserEmail}
          memberEmails={memberEmails}
          onClose={closePanel}
        />
      ) : null}

      {panel.type === 'kick' ? (
        <MemberKickConfirm
          householdId={householdId}
          memberId={panel.member.id}
          nickname={panel.nickname}
          onCancel={closePanel}
          onSuccess={closePanel}
        />
      ) : null}

      {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {error ? (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : '멤버 목록을 불러오지 못했습니다.'}
        </p>
      ) : null}

      {cancelError ? <p className={styles.error}>{cancelError}</p> : null}

      {!isLoading && !error ? (
        <MemberList
          members={members}
          profilesById={profilesById}
          currentUserId={currentUserId}
          isOwner={isOwner}
          pendingInvites={pendingInvites}
          cancellingInviteId={
            cancelInvite.isPending ? (cancelInvite.variables ?? null) : null
          }
          onKick={(member) =>
            setPanel({
              type: 'kick',
              member,
              nickname: profilesById.get(member.userId)?.nickname ?? '멤버',
            })
          }
          onCancelInvite={(invite) => {
            void handleCancelInvite(invite.id);
          }}
        />
      ) : null}
    </section>
  );
};
