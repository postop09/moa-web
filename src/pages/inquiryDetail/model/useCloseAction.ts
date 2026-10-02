'use client';

import { useRef, useState } from 'react';

import { useCloseInquiry } from '@/features/inquiry';

type Options = {
  onSuccess?: () => void;
  onFailure?: () => void;
};

export const useCloseAction = (
  inquiryId: string,
  { onSuccess, onFailure }: Options = {},
) => {
  const mutation = useCloseInquiry();
  // 상태 갱신은 비동기라 연속 클릭이 렌더 전에 들어올 수 있어 ref 로 동기 차단한다.
  const inFlightRef = useRef(false);
  const [isFailed, setIsFailed] = useState(false);

  const close = () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsFailed(false);
    mutation
      .mutateAsync({ inquiryId })
      .then(() => onSuccess?.())
      .catch(() => {
        setIsFailed(true);
        onFailure?.();
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  };

  return {
    close,
    resetFailure: () => setIsFailed(false),
    isPending: mutation.isPending,
    // 목록 갱신이 끝나기 전에도 종결 상태로 보여 중복 요청을 막는다.
    isClosed: mutation.isSuccess,
    isFailed,
  };
};
