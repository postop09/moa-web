import Link from 'next/link';

import styles from './guide.module.css';

export const GuideCta = () => {
  return (
    <section className={styles.cta} aria-labelledby="guide-cta-title">
      <h2 id="guide-cta-title" className={styles.ctaTitle}>
        모아로 공유 가계부 시작하기
      </h2>
      <p className={styles.ctaLead}>Google 계정과 브라우저만 있으면 됩니다.</p>
      <Link href="/login" className={styles.ctaButton}>
        모아 시작하기
      </Link>
    </section>
  );
};
