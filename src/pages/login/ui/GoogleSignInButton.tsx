'use client';

import { useSignInWithGoogle } from '@/features/auth';
import styles from './login.module.css';

type Props = {
  next?: string | null;
};

export const GoogleSignInButton = ({ next }: Props) => {
  const { signIn, isPending, error } = useSignInWithGoogle({ next });

  return (
    <div className={styles.cta}>
      <button
        type="button"
        className={styles.googleButton}
        onClick={signIn}
        disabled={isPending}
      >
        {isPending ? '연결 중…' : 'Google로 계속하기'}
      </button>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
};
