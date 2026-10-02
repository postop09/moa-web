import styles from './inquiryWrite.module.css';

export const WriteSkeleton = () => (
  <div
    className={styles.skeleton}
    role="status"
    aria-busy="true"
    aria-label="불러오는 중"
  >
    <div className={styles.skeletonLine} />
    <div className={styles.skeletonBlock} />
  </div>
);
