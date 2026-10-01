import type { InquiryStatusFilter } from './inquiryStatusFilter';

export type GetMyInquiriesReq = {
  userId: string;
  page: number;
  status?: InquiryStatusFilter;
};
