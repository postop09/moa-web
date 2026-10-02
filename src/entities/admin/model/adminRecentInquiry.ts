import type { InquiryCategory, InquiryStatus } from '@/shared/model';

/** `admin_user_recent_inquiries` 행. 같은 사용자의 다른 문의다. */
export type AdminRecentInquiry = {
  id: string;
  title: string;
  status: InquiryStatus;
  category: InquiryCategory | null;
  createdAt: string;
};
