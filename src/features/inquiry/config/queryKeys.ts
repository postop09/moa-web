import type { InquiryStatusFilter } from '@/entities/inquiry';

export const inquiryQueryKeys = {
  all: ['inquiries'] as const,
  /** status 를 주면 탭별 목록 키. 생략하면 모든 탭을 아우르는 접두 키(무효화용). */
  list: (status?: InquiryStatusFilter) =>
    status
      ? ([...inquiryQueryKeys.all, 'list', status] as const)
      : ([...inquiryQueryKeys.all, 'list'] as const),
  detail: (inquiryId: string) =>
    [...inquiryQueryKeys.all, 'detail', inquiryId] as const,
  messages: (inquiryId: string) =>
    [...inquiryQueryKeys.all, 'messages', inquiryId] as const,
  unreadCount: () => [...inquiryQueryKeys.all, 'unreadCount'] as const,
  attachmentUrls: (paths: string[]) =>
    [...inquiryQueryKeys.all, 'attachmentUrls', paths] as const,
};
