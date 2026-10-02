import { Button } from '@/shared/ui';

import { NETWORK_ERROR_TEXT } from '../config/texts';

import styles from './inquiryDetail.module.css';

export const DetailSkeleton = () => (
  <div className={styles.skeleton} aria-busy="true">
    <p className="srOnly">불러오는 중…</p>
    <span className={styles.skeletonMeta} aria-hidden />
    <span className={styles.skeletonCard} aria-hidden />
    <span className={styles.skeletonCard} aria-hidden />
  </div>
);

type ErrorProps = {
  onRetry: () => void;
};

export const DetailError = ({ onRetry }: ErrorProps) => (
  <div className={styles.state} role="alert">
    <p className={styles.stateText}>{NETWORK_ERROR_TEXT}</p>
    <Button variant="secondary" onClick={onRetry}>
      다시 시도
    </Button>
  </div>
);

type PendingQuestionProps = {
  title: string;
  /** 메시지를 불러오지 못했다. 제목은 문의 행에 있으므로 그대로 보여준다. */
  isError: boolean;
  onRetry: () => void;
};

/** 본문(메시지)이 아직 없어도 문의 행에 있는 제목은 바로 보여준다. */
export const PendingQuestion = ({
  title,
  isError,
  onRetry,
}: PendingQuestionProps) => (
  <article className={styles.question} aria-busy={!isError || undefined}>
    <h2 className={styles.questionTitle}>{title}</h2>
    {isError ? (
      <DetailError onRetry={onRetry} />
    ) : (
      <>
        <p className="srOnly">내용을 불러오는 중…</p>
        <span className={styles.skeletonCard} aria-hidden />
      </>
    )}
  </article>
);
