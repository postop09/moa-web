import Link from 'next/link';

import { WELCOME_SECTION_IDS } from '../config/sections';
import styles from './welcome.module.css';

export const WelcomeCta = () => {
  return (
    <section
      id={WELCOME_SECTION_IDS.cta}
      className={`${styles.ctaSection} ${styles.bandDark}`}
      aria-labelledby="welcome-cta-title"
    >
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>시작하기</p>
        <h2 id="welcome-cta-title" className={styles.ctaTitle}>
          지금 가계부를 만들어 보세요
        </h2>
        <p className={styles.sectionLead}>
          Google 계정과 브라우저만 있으면 됩니다. 설치 없이 바로 사용할 수
          있습니다.
        </p>
        <Link href="/login" className={styles.ctaButton}>
          Google로 시작하기
        </Link>
      </div>
    </section>
  );
};
