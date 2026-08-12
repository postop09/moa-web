'use client';

import { useSignInWithGoogle } from '../model/useSignInWithGoogle';
import styles from './login.module.css';

export const GoogleSignInButton = () => {
  const { signIn, isPending, error } = useSignInWithGoogle();

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
