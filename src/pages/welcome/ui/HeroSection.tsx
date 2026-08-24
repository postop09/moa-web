import Link from 'next/link';

import { GridBackdrop } from '@/shared/ui';

import { WELCOME_SECTION_IDS } from '../config/sections';
import { ProductFrame } from './ProductFrame';
import styles from './welcome.module.css';

export const HeroSection = () => {
  return (
    <section className={styles.hero} aria-labelledby="welcome-hero-title">
      <GridBackdrop />
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <h1 id="welcome-hero-title" className={styles.heroTitle}>
            돈 관리, 보면서 하자.
          </h1>
          <p className={styles.heroSupport}>
            수입·지출·저축을 적으면 남은 예산과 내 자산을 바로 볼 수 있어요.
            <br />
            혼자, 연인, 가족과 함께 해요.
          </p>
          <div className={styles.heroActions}>
            <Link href="/login" className={styles.ctaButton}>
              Google로 시작하기
            </Link>
            <a
              href={`#${WELCOME_SECTION_IDS.highlights}`}
              className={styles.ctaButtonGhost}
            >
              기능 보기
            </a>
          </div>
        </div>
        <div className={styles.heroProduct}>
          <ProductFrame clipped />
        </div>
      </div>
    </section>
  );
};
