'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { FAQ_SEARCH_MIN_LENGTH, searchFaqs } from '@/entities/faq';
import { createBrowserClient } from '@/shared/api';

import { faqQueryKeys } from '../config/queryKeys';

const SEARCH_DEBOUNCE_MS = 300;

/** 입력이 300ms 멈춘 뒤 trim된 키워드로 검색한다. 최소 길이 미만이면 조회하지 않는다.
 * 키워드가 바뀌어도 새 결과가 오기 전까지 이전 결과를 유지한다. */
export const useSearchFaqs = (keyword: string) => {
  const trimmed = keyword.trim();
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const query = useQuery({
    queryKey: faqQueryKeys.search(debounced),
    queryFn: () => searchFaqs(createBrowserClient(), debounced),
    enabled: debounced.length >= FAQ_SEARCH_MIN_LENGTH,
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    /** 입력은 바뀌었지만 아직 디바운스가 끝나지 않은 상태 */
    isDebouncing: trimmed !== debounced,
    /** 실제 조회에 쓰인 (trim된) 키워드 */
    debouncedKeyword: debounced,
  };
};
