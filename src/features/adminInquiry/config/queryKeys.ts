import type { AdminInquiryFilters } from '@/entities/admin';

export const adminQueryKeys = {
  all: ['admin'] as const,
  /** 필터를 주면 그 필터의 목록 키. 생략하면 모든 필터를 아우르는 접두 키(무효화용). */
  inquiries: (filters?: AdminInquiryFilters) =>
    filters
      ? ([...adminQueryKeys.all, 'inquiries', filters] as const)
      : ([...adminQueryKeys.all, 'inquiries'] as const),
  pendingCount: () => [...adminQueryKeys.all, 'pendingCount'] as const,
  inquiry: (inquiryId: string) =>
    [...adminQueryKeys.all, 'inquiry', inquiryId] as const,
  messages: (inquiryId: string) =>
    [...adminQueryKeys.all, 'messages', inquiryId] as const,
  recent: (inquiryId: string) =>
    [...adminQueryKeys.all, 'recent', inquiryId] as const,
  operators: () => [...adminQueryKeys.all, 'operators'] as const,
};
