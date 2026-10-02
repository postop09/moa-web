import styles from './composer.module.css';

type Props = {
  reason: string | null;
};

/** 종결된 문의는 작성 영역 대신 안내만 보인다. 사용자가 종결해 사유가 없으면 사유 줄은 없다. */
export const ClosedNotice = ({ reason }: Props) => (
  <section className={styles.closed} aria-label="종결 안내">
    <p className={styles.closedTitle}>종결된 문의예요.</p>
    {reason ? (
      <p className={styles.closedReason}>{`종결 사유: ${reason}`}</p>
    ) : null}
  </section>
);
