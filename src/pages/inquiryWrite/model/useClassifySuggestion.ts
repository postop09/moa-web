'use client';

import { useEffect, useState } from 'react';

import {
  classifyInquiry,
  INQUIRY_BODY_MIN,
  type InquiryCategory,
} from '@/entities/inquiry';

const DEBOUNCE_MS = 800;

/**
 * 내용 입력이 멈추면 예비 분류를 호출해 추천 도움말 카테고리를 돌려준다.
 * 추가 입력·언마운트 시 진행 중인 요청은 abort 한다. 실패는 추천 없음으로 처리한다.
 */
export const useClassifySuggestion = (text: string, enabled: boolean) => {
  const [category, setCategory] = useState<InquiryCategory | null>(null);
  const trimmed = text.trim();
  const isLongEnough = [...trimmed].length >= INQUIRY_BODY_MIN;
  const isActive = enabled && isLongEnough;

  useEffect(() => {
    if (!isActive) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await classifyInquiry(trimmed, controller.signal);
        if (!controller.signal.aborted) setCategory(result.category);
      } catch {
        if (!controller.signal.aborted) setCategory(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isActive, trimmed]);

  return { category: isActive ? category : null, isActive };
};
