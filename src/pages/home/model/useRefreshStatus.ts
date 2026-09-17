'use client';

import { useEffect, useRef, useState } from 'react';

const UPDATING_MESSAGE = '이전 데이터 · 업데이트 중…';
const UPDATED_MESSAGE = '최신 정보로 업데이트되었습니다';
const ERROR_MESSAGE = '최신 정보를 가져오지 못했어요';
const UPDATED_MESSAGE_DURATION_MS = 3000;

type Input = {
  isFetching: boolean;
  hasError: boolean;
};

export const useRefreshStatus = ({ isFetching, hasError }: Input) => {
  const [isRecentlyUpdated, setIsRecentlyUpdated] = useState(false);
  const prevIsFetchingRef = useRef(isFetching);

  useEffect(() => {
    const wasFetching = prevIsFetchingRef.current;
    prevIsFetchingRef.current = isFetching;

    if (isFetching || hasError || !wasFetching) {
      setIsRecentlyUpdated(false);
      return;
    }

    setIsRecentlyUpdated(true);
    const timer = setTimeout(() => {
      setIsRecentlyUpdated(false);
    }, UPDATED_MESSAGE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isFetching, hasError]);

  if (hasError) {
    return { message: ERROR_MESSAGE };
  }

  if (isFetching) {
    return { message: UPDATING_MESSAGE };
  }

  return { message: isRecentlyUpdated ? UPDATED_MESSAGE : '' };
};
