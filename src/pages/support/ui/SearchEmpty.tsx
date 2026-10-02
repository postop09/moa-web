import Link from 'next/link';

import styles from './support.module.css';

export const SearchEmpty = () => {
  return (
    <div className={styles.state}>
      <p className={styles.stateText}>찾는 답변이 없나요? 직접 문의해주세요.</p>
      <Link href="/support/inquiries/new" className={styles.retryButton}>
        1:1 문의하기
      </Link>
    </div>
  );
};
