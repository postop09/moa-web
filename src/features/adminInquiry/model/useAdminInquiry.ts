'use client';

import { useQuery } from '@tanstack/react-query';

import { getAdminErrorKind, getAdminInquiry } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { adminQueryKeys } from '../config/queryKeys';

/** 문의 상세. 없는 문의는 not_found 오류로 노출된다. */
export const useAdminInquiry = (inquiryId: string) =>
  useQuery({
    queryKey: adminQueryKeys.inquiry(inquiryId),
    queryFn: () => getAdminInquiry(createBrowserClient(), inquiryId),
    // 열 때마다 서버의 최신 값을 받는다. 열기·답변 충돌 검사의 기준이 낡은 캐시면 안 된다.
    refetchOnMount: 'always',
    // 일시 오류는 한 번 더 시도한다. 없는 문의나 권한 오류는 다시 해도 같다.
    retry: (failureCount, error) => {
      const kind = getAdminErrorKind(error);

      return failureCount < 1 && kind !== 'not_found' && kind !== 'forbidden';
    },
  });
