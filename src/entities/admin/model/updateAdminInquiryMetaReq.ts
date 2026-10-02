import type { InquiryCategory } from '@/shared/model';

/** 생략한 항목은 "변경 없음" 이다. 상태는 종결 외 두 값으로만 바꿀 수 있다. */
export type UpdateAdminInquiryMetaReq = {
  inquiryId: string;
  status?: 'waiting' | 'in_progress';
  assigneeId?: string;
  category?: InquiryCategory;
};
