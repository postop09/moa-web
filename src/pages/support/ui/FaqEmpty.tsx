import Link from 'next/link';

import styles from './support.module.css';

type Props = {
  /** 카테고리가 선택된 상태면 전체 목록으로 돌아가는 버튼을 보여준다. */
  showAllVisible: boolean;
  onShowAll: () => void;
};

export const FaqEmpty = ({ showAllVisible, onShowAll }: Props) => {
  return (
    <div className={styles.state}>
      <p className={styles.stateText}>아직 등록된 질문이 없어요</p>
      <Link href="/support/inquiries/new" className={styles.retryButton}>
        1:1 문의하기
      </Link>
      {showAllVisible ? (
        <button
          type="button"
          className={styles.retryButton}
          onClick={onShowAll}
        >
          전체 질문 보기
        </button>
      ) : null}
    </div>
  );
};
