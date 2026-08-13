'use client';

import { useSignOut } from '@/features/auth';
import { useGetProfile } from '@/features/profile';

import styles from '../settings.module.css';

export const AccountSection = () => {
  const { data: profile, isLoading, error } = useGetProfile();
  const {
    mutateAsync: signOut,
    isPending,
    error: signOutError,
  } = useSignOut();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>계정</h2>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={handleSignOut}
          disabled={isPending}
        >
          {isPending ? '로그아웃 중…' : '로그아웃'}
        </button>
      </header>

      {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {error ? (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : '계정 정보를 불러오지 못했습니다.'}
        </p>
      ) : null}

      {profile ? (
        <dl className={styles.infoList}>
          <div className={styles.infoRow}>
            <dt className={styles.infoLabel}>닉네임</dt>
            <dd className={styles.infoValue}>{profile.nickname}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt className={styles.infoLabel}>이메일</dt>
            <dd className={styles.infoValue}>{profile.email}</dd>
          </div>
        </dl>
      ) : null}

      {signOutError ? (
        <p className={styles.error}>
          {signOutError instanceof Error
            ? signOutError.message
            : '로그아웃에 실패했습니다.'}
        </p>
      ) : null}
    </section>
  );
};
