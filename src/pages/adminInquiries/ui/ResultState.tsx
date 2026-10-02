import styles from './adminInquiries.module.css';

type EmptyProps = {
  /** 기본 필터면 "처리할 문의 없음" 안내와 최근 답변 완료 보기를, 아니면 필터 초기화를 보인다. */
  isDefault: boolean;
  onReset: () => void;
  onShowAnswered: () => void;
};

export const EmptyResult = ({
  isDefault,
  onReset,
  onShowAnswered,
}: EmptyProps) => (
  <div className={styles.state}>
    <p className={styles.stateText}>
      {isDefault ? '지금 처리할 문의가 없어요.' : '조건에 맞는 문의가 없어요.'}
    </p>
    <button
      type="button"
      className={styles.stateButton}
      onClick={isDefault ? onShowAnswered : onReset}
    >
      {isDefault ? '최근 답변 완료 보기' : '필터 초기화'}
    </button>
  </div>
);

type ErrorProps = {
  /** 권한 없음·로그인 만료로 보이는 오류면 안내 문구를 바꾼다. */
  isAuthError: boolean;
  onRetry: () => void;
};

export const ErrorResult = ({ isAuthError, onRetry }: ErrorProps) => (
  <div className={styles.state} role="alert">
    <p className={styles.stateText}>
      {isAuthError
        ? '권한이 없거나 로그인이 만료됐어요. 다시 로그인해주세요.'
        : '문의 목록을 불러오지 못했어요. 다시 시도해주세요.'}
    </p>
    <button type="button" className={styles.stateButton} onClick={onRetry}>
      다시 시도
    </button>
  </div>
);
