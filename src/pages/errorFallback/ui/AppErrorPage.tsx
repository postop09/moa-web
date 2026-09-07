'use client';

import { useEffect } from 'react';

import styles from './errorFallback.module.css';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export const AppErrorPage = ({ error, reset }: Props) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.card} role="alert">
        <p className={styles.title}>문제가 발생했습니다.</p>
        <p className={styles.description}>
          잠시 후 다시 시도해 주세요. 문제가 계속되면 새로고침해 주세요.
        </p>
        <button type="button" className={styles.retryButton} onClick={reset}>
          다시 시도
        </button>
      </div>
    </main>
  );
};
