import Link from 'next/link';

import styles from './support.module.css';

export const InquiryCta = () => {
  return (
    <div className={styles.cta}>
      <Link href="/support/inquiries/new" className={styles.ctaButton}>
        1:1 문의하기
      </Link>
      <p className={styles.ctaHint}>평일 기준 1일 이내 답변해요</p>
    </div>
  );
};
