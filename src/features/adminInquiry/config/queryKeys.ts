import type { AdminInquiryFilters } from '@/entities/admin';

export const adminQueryKeys = {
  all: ['admin'] as const,
  inquiries: (filters: AdminInquiryFilters) =>
    [...adminQueryKeys.all, 'inquiries', filters] as const,
  pendingCount: () => [...adminQueryKeys.all, 'pendingCount'] as const,
};
