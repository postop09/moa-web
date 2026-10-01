import Link from 'next/link';

import styles from './myInquiries.module.css';

type EmptyProps = {
  /** 필터된 탭의 이름. 전체 탭이면 null. */
  filterLabel: string | null;
  onShowAll: () => void;
};

export const ListEmpty = ({ filterLabel, onShowAll }: EmptyProps) =>
  filterLabel ? (
    <div className={styles.state}>
      <p className={styles.stateText}>{`${filterLabel} 문의가 없어요.`}</p>
      <button type="button" className={styles.stateButton} onClick={onShowAll}>
        전체 보기
      </button>
    </div>
  ) : (
    <div className={styles.state}>
      <p className={styles.stateText}>아직 남긴 문의가 없어요.</p>
      <Link href="/support/inquiries/new" className={styles.stateButton}>
        1:1 문의하기
      </Link>
    </div>
  );

type ErrorProps = {
  onRetry: () => void;
};

export const ListError = ({ onRetry }: ErrorProps) => (
  <div className={styles.state} role="alert">
    <p className={styles.stateText}>
      연결이 불안정해요. 잠시 후 다시 시도해주세요.
    </p>
    <button type="button" className={styles.stateButton} onClick={onRetry}>
      다시 시도
    </button>
  </div>
);
