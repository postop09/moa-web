'use client';

import { useRouter } from 'next/navigation';

import {
  useAcceptHouseholdInvite,
  useGetHouseholdInviteByToken,
} from '@/features/householdMember';
import { persistAuthGateReadyCookie } from '@/features/onboarding';
import { useGetProfile } from '@/features/profile';
import { GridBackdrop, MoaLogo } from '@/shared/ui';

import styles from './acceptInvite.module.css';

type Props = {
  token: string;
};

export const AcceptInvitePage = ({ token }: Props) => {
  const router = useRouter();
  const inviteQuery = useGetHouseholdInviteByToken(token);
  const profileQuery = useGetProfile();
  const { mutateAsync, isPending, error } = useAcceptHouseholdInvite(token);

  const invite = inviteQuery.data;
  const profile = profileQuery.data;
  const isLoading = inviteQuery.isLoading || profileQuery.isLoading;

  const emailMismatch = Boolean(
    invite &&
    profile &&
    invite.email.trim().toLowerCase() !== profile.email.trim().toLowerCase(),
  );
  const isPendingInvite = invite?.status === 'pending';
  const canAccept = Boolean(
    invite && profile && isPendingInvite && !emailMismatch,
  );

  const handleAccept = async () => {
    try {
      await mutateAsync();
      try {
        await persistAuthGateReadyCookie();
      } catch {
        // 다음 앱 진입 시 풀 게이트로 복구
      }
      router.replace('/');
      router.refresh();
    } catch {
      // mutation error state에 표시
    }
  };

  const message = (() => {
    if (inviteQuery.error) {
      return inviteQuery.error instanceof Error
        ? inviteQuery.error.message
        : '초대를 불러오지 못했습니다.';
    }

    if (!isLoading && !invite) {
      return '초대를 찾을 수 없습니다.';
    }

    if (invite && !isPendingInvite) {
      return '이미 처리된 초대입니다.';
    }

    if (emailMismatch) {
      return `초대받은 이메일(${invite?.email})과 로그인 계정이 다릅니다.`;
    }

    if (error) {
      return error instanceof Error
        ? error.message
        : '초대 수락에 실패했습니다.';
    }

    return null;
  })();

  return (
    <main className={styles.page}>
      <GridBackdrop />
      <div className={styles.panel}>
        <header className={styles.hero}>
          <MoaLogo variant="black" size={72} className={styles.brand} />
          <h1 className={styles.headline}>가계부 초대</h1>
          <p className={styles.support}>
            {isLoading
              ? '초대를 확인하는 중…'
              : invite
                ? '초대를 수락하면 이 가계부에 멤버로 참여합니다.'
                : '유효한 초대를 찾지 못했습니다.'}
          </p>
        </header>

        {invite ? (
          <div className={styles.meta}>
            <span className={styles.metaLabel}>가계부</span>
            <span className={styles.metaValue}>{invite.householdName}</span>
            <span className={styles.metaLabel}>초대 이메일</span>
            <span className={styles.metaValue}>{invite.email}</span>
          </div>
        ) : null}

        {message ? <p className={styles.error}>{message}</p> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.submit}
            onClick={handleAccept}
            disabled={!canAccept || isPending}
          >
            {isPending ? '참여하는 중…' : '초대 수락'}
          </button>
        </div>
      </div>
    </main>
  );
};
