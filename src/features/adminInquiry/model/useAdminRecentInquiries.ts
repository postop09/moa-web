'use client';

import { useQuery } from '@tanstack/react-query';

import { getAdminUserRecentInquiries } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { adminQueryKeys } from '../config/queryKeys';

/** 같은 사용자의 이전 문의. */
export const useAdminRecentInquiries = (inquiryId: string) =>
  useQuery({
    queryKey: adminQueryKeys.recent(inquiryId),
    queryFn: () =>
      getAdminUserRecentInquiries(createBrowserClient(), { inquiryId }),
  });
