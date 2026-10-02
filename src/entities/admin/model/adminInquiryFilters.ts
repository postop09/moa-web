import type { InquiryCategory, InquiryStatus } from '@/shared/model';

export type AdminInquirySort = 'waiting' | 'confidence' | 'createdAt';
export type AdminInquirySortDir = 'asc' | 'desc';
export type AdminInquiryPageSize = 20 | 50 | 100;
/** 일 수. null 은 전체 기간. */
export type AdminInquiryPeriodDays = 7 | 30 | 90 | null;

export type AdminInquiryFilters = {
  statuses: InquiryStatus[];
  category: InquiryCategory | null;
  uncategorizedOnly: boolean;
  periodDays: AdminInquiryPeriodDays;
  keyword: string;
  sort: AdminInquirySort;
  sortDir: AdminInquirySortDir;
  /** 1부터 시작 */
  page: number;
  pageSize: AdminInquiryPageSize;
};
