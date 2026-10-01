'use client';

import { useQuery } from '@tanstack/react-query';

import { getInquiry } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { inquiryQueryKeys } from '../config/queryKeys';

/** 삭제됐거나 접근할 수 없는 문의는 data 가 null. */
export const useInquiry = (
  inquiryId: string,
  options?: { retry?: number | boolean },
) =>
  useQuery({
    queryKey: inquiryQueryKeys.detail(inquiryId),
    queryFn: () => getInquiry(createBrowserClient(), inquiryId),
    ...(options?.retry !== undefined && { retry: options.retry }),
  });
