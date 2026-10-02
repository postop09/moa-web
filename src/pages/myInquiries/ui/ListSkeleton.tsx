import styles from './myInquiries.module.css';

export const ListSkeleton = () => (
  <div className={styles.skeleton} aria-busy="true">
    <p className="srOnly">불러오는 중…</p>
    {[0, 1, 2].map((index) => (
      <span key={index} className={styles.skeletonCard} aria-hidden />
    ))}
  </div>
);
