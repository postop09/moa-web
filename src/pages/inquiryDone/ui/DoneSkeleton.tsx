import styles from './inquiryDone.module.css';

export const DoneSkeleton = () => (
  <div
    className={styles.skeleton}
    role="status"
    aria-busy="true"
    aria-label="불러오는 중"
  >
    <div className={styles.skeletonLine} />
  </div>
);
