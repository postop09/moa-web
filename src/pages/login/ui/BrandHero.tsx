import { MoaLogo } from '@/shared/ui';

import styles from './login.module.css';

export const BrandHero = () => {
  return (
    <header className={styles.hero}>
      <MoaLogo variant="black" size={88} className={styles.brand} priority />
      <h1 className={styles.headline}>통계로 보는 자산</h1>
      <p className={styles.support}>그래프 중심 가계부로 흐름을 한눈에.</p>
    </header>
  );
};
