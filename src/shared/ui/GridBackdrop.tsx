import styles from './gridBackdrop.module.css';

export const GridBackdrop = () => {
  return (
    <div className={styles.backdrop} aria-hidden>
      <div className={styles.grid} />
      <div className={styles.axisX} />
      <div className={styles.axisY} />
    </div>
  );
};
