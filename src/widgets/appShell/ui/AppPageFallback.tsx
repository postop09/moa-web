import styles from './appPageFallback.module.css';

export const AppPageFallback = () => {
  return (
    <div
      className={styles.fallback}
      role="status"
      aria-live="polite"
      aria-label="페이지를 불러오는 중"
    >
      <div className={`${styles.block} ${styles.title}`} />
      <div className={`${styles.block} ${styles.hero}`} />
      <div className={styles.grid}>
        <div className={`${styles.block} ${styles.card}`} />
        <div className={`${styles.block} ${styles.card}`} />
      </div>
    </div>
  );
};
