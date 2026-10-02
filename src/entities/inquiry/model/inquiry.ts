import type { InquiryCategory } from '../config/inquiryCategories';
import type { InquiryStatus } from '../config/inquiryStatus';
import type { DeviceInfo } from './deviceInfo';

/** `inquiries` 테이블 행. 질문 본문은 첫 `inquiry-messages`(kind 'question')에 있다. */
export type Inquiry = {
  id: string;
  userId: string;
  title: string;
  status: InquiryStatus;
  category: InquiryCategory | null;
  deviceInfo: DeviceInfo | null;
  hasUnreadReply: boolean;
  rating: number | null;
  waitingSince: string;
  createdAt: string;
  updatedAt: string;
};
