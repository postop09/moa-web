'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { getCachedUser } from '@/entities/auth';
import { getMyInquiries } from '@/entities/inquiry';
import type {
  GetMyInquiriesRes,
  InquiryStatusFilter,
} from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { inquiryQueryKeys } from '../config/queryKeys';

const EMPTY_PAGE: GetMyInquiriesRes = { items: [], nextPage: null };

/** 내 문의 목록(20개씩 무한 스크롤). 로그인 사용자가 없으면 빈 페이지 하나. */
export const useMyInquiries = (status: InquiryStatusFilter) => {
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: inquiryQueryKeys.list(status),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const supabase = createBrowserClient();
      const user = await getCachedUser(supabase, queryClient);

      if (!user) return EMPTY_PAGE;

      return getMyInquiries(supabase, {
        userId: user.id,
        page: pageParam,
        status,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
};
