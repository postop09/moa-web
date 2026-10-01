import type { InquiryCategory } from '../config/inquiryCategories';

export type ClassifyInquiryRes = {
  category: InquiryCategory | null;
  confidence: number | null;
};
