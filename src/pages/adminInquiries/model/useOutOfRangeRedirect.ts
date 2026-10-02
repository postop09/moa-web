'use client';

import { useEffect, useRef } from 'react';

import { serializeAdminInquiryFilters } from '@/entities/admin';
import type { AdminInquiryFilters } from '@/entities/admin';
import { useToast } from '@/shared/ui';

const MESSAGE = '마지막 페이지가 없어 1쪽으로 이동했어요';

/**
 * 결과가 0건인데 page > 1 이면(예: 필터를 좁힌 뒤 새로고침) 빈 상태 대신 1쪽으로 돌려보내고
 * 토스트로 알린다. 같은 필터로는 한 번만 보낸다. 1쪽에서도 비면 page 가 1 이라 다시 보내지 않는다.
 */
export const useOutOfRangeRedirect = (
  isOutOfRange: boolean,
  filters: AdminInquiryFilters,
  replaceWith: (next: AdminInquiryFilters) => void,
) => {
  const showToast = useToast((state) => state.showToast);
  const redirectedFor = useRef<string | null>(null);
  const filterKey = serializeAdminInquiryFilters(filters);
  const filtersRef = useRef(filters);
  const replaceRef = useRef(replaceWith);
  const toastRef = useRef(showToast);

  useEffect(() => {
    filtersRef.current = filters;
    replaceRef.current = replaceWith;
    toastRef.current = showToast;
  });

  useEffect(() => {
    if (!isOutOfRange || redirectedFor.current === filterKey) return;

    redirectedFor.current = filterKey;
    replaceRef.current({ ...filtersRef.current, page: 1 });
    toastRef.current(MESSAGE);
  }, [isOutOfRange, filterKey]);
};
