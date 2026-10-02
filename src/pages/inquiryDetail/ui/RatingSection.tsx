'use client';

import { Star } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

import { RATE_FAILURE_TEXT } from '../config/texts';

import styles from './inquiryDetail.module.css';

type Props = {
  /** 서버에 저장된 별점. 있으면 읽기 전용이다. */
  rating: number | null;
  pendingRating: number | null;
  savedRating: number | null;
  isFailed: boolean;
  onRate: (rating: number) => void;
};

const STARS = [1, 2, 3, 4, 5];

const StarIcon = ({ filled }: { filled: boolean }) => (
  <Star
    size={32}
    strokeWidth={1.75}
    className={filled ? styles.starFilled : styles.star}
    aria-hidden
  />
);

export const RatingSection = ({
  rating,
  pendingRating,
  savedRating,
  isFailed,
  onRate,
}: Props) => {
  const titleId = useId();
  const resultRef = useRef<HTMLParagraphElement>(null);
  const finalRating = rating ?? savedRating;
  const isSavedNow = savedRating !== null;

  // 별을 누르면 버튼이 사라지므로 결과 문구로 포커스를 옮겨 body 로 빠지지 않게 한다.
  // 결과는 포커스 이동으로 한 번만 안내하고 live region 에는 싣지 않는다.
  useEffect(() => {
    if (isSavedNow) resultRef.current?.focus();
  }, [isSavedNow]);

  if (finalRating !== null) {
    return (
      <section className={styles.rating} aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.ratingTitle}>
          답변이 도움이 됐나요?
        </h2>
        <div className={styles.stars} aria-hidden>
          {STARS.map((n) => (
            <StarIcon key={n} filled={n <= finalRating} />
          ))}
        </div>
        <p
          ref={resultRef}
          tabIndex={-1}
          className={styles.ratingResult}
        >{`별점 ${finalRating}점을 남겼어요`}</p>
      </section>
    );
  }

  return (
    <section className={styles.rating}>
      <h2 id={titleId} className={styles.ratingTitle}>
        답변이 도움이 됐나요?
      </h2>
      <div className={styles.stars} role="group" aria-labelledby={titleId}>
        {STARS.map((n) => (
          <button
            key={n}
            type="button"
            className={styles.starButton}
            aria-label={`5점 만점에 ${n}점`}
            onClick={() => onRate(n)}
          >
            <StarIcon filled={pendingRating !== null && n <= pendingRating} />
          </button>
        ))}
      </div>
      <p className={styles.ratingHelper}>별점은 한 번만 남길 수 있어요</p>
      {isFailed ? (
        <p className={styles.inlineError} role="alert">
          {RATE_FAILURE_TEXT}
        </p>
      ) : null}
    </section>
  );
};
