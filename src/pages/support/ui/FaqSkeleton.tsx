import styles from './support.module.css';

export const FaqSkeleton = () => {
  return (
    <div className={styles.skeleton} aria-busy="true">
      <p className="srOnly">불러오는 중…</p>
      {[0, 1, 2, 3].map((index) => (
        <span key={index} className={styles.skeletonRow} aria-hidden />
      ))}
    </div>
  );
};
