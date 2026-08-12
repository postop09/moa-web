import styles from './ui/home.module.css';

export const HomePage = () => {
  return (
    <main className={styles.page}>
      <h1 className={styles.headline}>홈</h1>
      <p className={styles.support}>가계부 홈은 곧 여기에 표시됩니다.</p>
    </main>
  );
};
