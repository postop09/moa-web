import type { InquiryCategory } from '../config/inquiryCategories';
import type { DeviceInfo } from './deviceInfo';

export type CreateInquiryReq = {
  title: string;
  body: string;
  category: InquiryCategory | null;
  confidence: number | null;
  deviceInfo: DeviceInfo;
  attachments: string[];
};
