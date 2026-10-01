'use client';

import { useRef, useState } from 'react';

import { useRateInquiry } from '@/features/inquiry';

type Options = {
  onSuccess?: () => void;
};

export const useRateAction = (
  inquiryId: string,
  { onSuccess }: Options = {},
) => {
  const mutation = useRateInquiry();
  const inFlightRef = useRef(false);
  /** 저장 중인 선택. 실패하면 비워 선택을 되돌린다. */
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  /** 이번 방문에서 저장에 성공한 값. 서버 갱신이 도착하기 전에도 읽기 전용으로 바꾼다. */
  const [savedRating, setSavedRating] = useState<number | null>(null);
  const [isFailed, setIsFailed] = useState(false);

  const rate = (rating: number) => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsFailed(false);
    setPendingRating(rating);
    mutation
      .mutateAsync({ inquiryId, rating })
      .then(() => {
        setSavedRating(rating);
        onSuccess?.();
      })
      .catch(() => setIsFailed(true))
      .finally(() => {
        inFlightRef.current = false;
        setPendingRating(null);
      });
  };

  return { rate, pendingRating, savedRating, isFailed };
};
