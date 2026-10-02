import type { InquiryCategory, InquiryStatus } from '@/shared/model';

/** `admin_get_inquiry` 가 돌려주는 문의 상세 한 행. */
export type AdminInquiry = {
  id: string;
  /** 문의 작성자. 첨부 업로드 경로의 폴더 이름이기도 하다. */
  userId: string;
  title: string;
  status: InquiryStatus;
  /** null 이면 미분류 */
  category: InquiryCategory | null;
  categoryConfidence: number | null;
  deviceInfo: Record<string, unknown> | null;
  assigneeId: string | null;
  assigneeEmail: string | null;
  hasUnreadReply: boolean;
  rating: number | null;
  closeReason: string | null;
  waitingSince: string;
  createdAt: string;
  updatedAt: string;
};
