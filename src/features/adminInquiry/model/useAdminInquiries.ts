'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getAdminInquiries } from '@/entities/admin';
import type { AdminInquiryFilters } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { adminQueryKeys } from '../config/queryKeys';

/** 어드민 문의 목록. 필터가 바뀌어도 새 결과가 올 때까지 이전 결과를 유지한다. */
export const useAdminInquiries = (filters: AdminInquiryFilters) =>
  useQuery({
    queryKey: adminQueryKeys.inquiries(filters),
    queryFn: () => getAdminInquiries(createBrowserClient(), filters),
    placeholderData: keepPreviousData,
  });
