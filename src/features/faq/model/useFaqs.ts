'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getFaqs } from '@/entities/faq';
import { createBrowserClient } from '@/shared/api';

import { faqQueryKeys } from '../config/queryKeys';

/** category를 생략하면 전체 FAQ를 조회한다. */
export const useFaqs = (category?: string) => {
  return useQuery({
    queryKey: faqQueryKeys.list(category),
    queryFn: () => getFaqs(createBrowserClient(), category),
    // 카테고리 전환 중 스켈레톤이 깜빡이지 않게 이전 목록을 유지한다.
    placeholderData: keepPreviousData,
  });
};
