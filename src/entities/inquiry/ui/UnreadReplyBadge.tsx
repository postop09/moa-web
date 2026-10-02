import styles from './inquiryBadge.module.css';

type Props = {
  count?: number;
};

export const UnreadReplyBadge = ({ count }: Props) => (
  <span className={styles.unreadBadge}>
    <span className={styles.unreadDot} aria-hidden />
    {count === undefined ? '새 답변' : `새 답변 ${count}`}
  </span>
);
