import { Button } from '@/shared/ui';

import styles from './myInquiries.module.css';

type Props = {
  /** 다음 페이지를 불러오다 실패했다. */
  isError: boolean;
  isLoading: boolean;
  /** IntersectionObserver 가 없을 때만 직접 누르는 '더 보기' 를 보여준다. */
  showLoadMore: boolean;
  onLoadMore: () => void;
};

export const MoreRow = ({
  isError,
  isLoading,
  showLoadMore,
  onLoadMore,
}: Props) => {
  if (isError) {
    return (
      <div className={styles.moreRow} role="alert">
        <p className={styles.stateText}>
          다음 문의를 불러오지 못했어요. 연결을 확인해주세요.
        </p>
        <Button variant="secondary" loading={isLoading} onClick={onLoadMore}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (showLoadMore) {
    return (
      <div className={styles.moreRow}>
        <Button variant="secondary" loading={isLoading} onClick={onLoadMore}>
          더 보기
        </Button>
      </div>
    );
  }

  return isLoading ? (
    <div className={styles.moreRow} aria-hidden>
      <span className={styles.skeletonCard} />
    </div>
  ) : null;
};
