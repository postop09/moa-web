'use client';

import { useEffect, useRef } from 'react';

import { useMarkInquiryRead } from '@/features/inquiry';

/**
 * 미확인 답변이 있는 문의를 열면 읽음 처리한다. 메시지 조회가 성공하고 답변이 실제로 있을 때만
 * (사용자가 답변을 볼 수 있을 때만) 호출한다. 실패해도 사용자에게 알리지 않는다.
 * 캐시가 갱신돼 다시 렌더링돼도 ref 로 중복 호출을 막고, 서버 값이 false 가 되면 가드를 풀어
 * 이후 새 답변이 오면 다시 읽음 처리한다.
 */
export const useMarkReadOnce = (
  inquiryId: string,
  hasUnreadReply: boolean | undefined,
  canMark: boolean,
) => {
  const { mutate } = useMarkInquiryRead();
  const markedRef = useRef(false);

  useEffect(() => {
    if (hasUnreadReply === false) {
      markedRef.current = false;
      return;
    }

    if (!hasUnreadReply || !canMark || markedRef.current) return;

    markedRef.current = true;
    mutate({ inquiryId });
  }, [hasUnreadReply, canMark, inquiryId, mutate]);
};
