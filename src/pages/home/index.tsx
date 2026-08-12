import { GridBackdrop } from '@/shared/ui';

import styles from './ui/home.module.css';

export const HomePage = () => {
  return (
    <main className={styles.page}>
      <GridBackdrop />
      <div className={styles.panel}>
        <p className={styles.brand}>Moa</p>
        <h1 className={styles.headline}>준비가 완료됐어요</h1>
        <p className={styles.support}>가계부 홈은 곧 여기에 표시됩니다.</p>
      </div>
    </main>
  );
};
