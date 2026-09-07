import Link from 'next/link';

import styles from './errorFallback.module.css';

export const NotFoundPage = () => {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.title}>페이지를 찾을 수 없습니다.</p>
        <p className={styles.description}>
          주소가 잘못되었거나 삭제된 페이지일 수 있습니다.
        </p>
        <Link href="/" className={styles.retryButton}>
          홈으로 이동
        </Link>
      </div>
    </main>
  );
};
