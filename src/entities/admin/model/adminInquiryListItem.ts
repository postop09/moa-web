import type { InquiryCategory, InquiryStatus } from '@/shared/model';

export type AdminInquiryListItem = {
  id: string;
  title: string;
  status: InquiryStatus;
  /** null 이면 미분류 */
  category: InquiryCategory | null;
  categoryConfidence: number | null;
  waitingSince: string;
  createdAt: string;
  assigneeId: string | null;
  assigneeEmail: string | null;
};

export type GetAdminInquiriesRes = {
  items: AdminInquiryListItem[];
  /** 페이지네이션 이전 전체 건수 */
  total: number;
};
