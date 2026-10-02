import styles from './support.module.css';

type Props = {
  onRetry: () => void;
};

export const FaqError = ({ onRetry }: Props) => {
  return (
    <div className={styles.state} role="alert">
      <p className={styles.stateText}>
        연결이 불안정해요. 잠시 후 다시 시도해주세요.
      </p>
      <button type="button" className={styles.retryButton} onClick={onRetry}>
        다시 시도
      </button>
    </div>
  );
};
