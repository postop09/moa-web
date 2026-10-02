export { classifyInquiry } from './api/classifyInquiry';
export { addInquiryFollowUp } from './api/addInquiryFollowUp';
export { closeInquiry } from './api/closeInquiry';
export { createInquiry } from './api/createInquiry';
export { deleteInquiry } from './api/deleteInquiry';
export { deleteInquiryAttachments } from './api/deleteInquiryAttachments';
export { getAttachmentUrls } from './api/getAttachmentUrls';
export { getInquiry } from './api/getInquiry';
export { getInquiryMessages } from './api/getInquiryMessages';
export { getMyInquiries } from './api/getMyInquiries';
export { getUnreadReplyCount } from './api/getUnreadReplyCount';
export { markInquiryRead } from './api/markInquiryRead';
export { rateInquiry } from './api/rateInquiry';
export { updateInquiry } from './api/updateInquiry';
export { uploadInquiryAttachment } from './api/uploadInquiryAttachment';

export {
  INQUIRY_CLASSIFY_CRITERIA,
  INQUIRY_CLASSIFY_INSTRUCTIONS,
} from './config/classifyCriteria';
export {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABELS,
  UNCATEGORIZED_USER_LABEL,
  getInquiryCategoryLabel,
} from './config/inquiryCategories';
export type { InquiryCategory } from './config/inquiryCategories';
export { INQUIRY_IMAGE_REJECT_MESSAGES } from './config/inquiryImageRejectMessages';
export {
  getAdminStatusLabel,
  getUserStatusLabel,
} from './config/inquiryStatus';
export type { InquiryStatus } from './config/inquiryStatus';
export {
  INQUIRY_BODY_MAX,
  INQUIRY_BODY_MIN,
  INQUIRY_CLASSIFY_THRESHOLD,
  INQUIRY_IMAGE_TYPES,
  INQUIRY_MAX_IMAGE_BYTES,
  INQUIRY_MAX_IMAGES,
  INQUIRY_PAGE_SIZE,
  INQUIRY_TITLE_MAX,
  INQUIRY_TITLE_MIN,
} from './config/limits';

export {
  collectDeviceInfo,
  parseDeviceInfo,
  withDeviceExtras,
} from './lib/collectDeviceInfo';
export {
  formatInquiryDetailDate,
  formatInquiryListDate,
} from './lib/formatInquiryDate';
export { isDefinitiveRejection } from './lib/isDefinitiveRejection';
export { getWaitingHours, isOverdue } from './lib/getWaitingHours';
export { mapJevCategory } from './lib/mapJevCategory';
export type { ClassifyInquiryRes } from './model/classifyInquiryRes';
export { validateInquiryForm } from './lib/validateInquiryForm';
export { validateInquiryImages } from './lib/validateInquiryImages';

export type { AddInquiryFollowUpReq } from './model/addInquiryFollowUpReq';
export type { CreateInquiryReq } from './model/createInquiryReq';
export type { DeviceInfo } from './model/deviceInfo';
export type { GetAttachmentUrlsRes } from './model/getAttachmentUrlsRes';
export type { GetInquiryRes } from './model/getInquiryRes';
export type { GetMyInquiriesReq } from './model/getMyInquiriesReq';
export type { GetMyInquiriesRes } from './model/getMyInquiriesRes';
export type { Inquiry } from './model/inquiry';
export type {
  InquiryMessage,
  InquiryMessageKind,
} from './model/inquiryMessage';
export type { InquiryStatusFilter } from './model/inquiryStatusFilter';
export type { RateInquiryReq } from './model/rateInquiryReq';
export type { UpdateInquiryReq } from './model/updateInquiryReq';
export type { UploadInquiryAttachmentReq } from './model/uploadInquiryAttachmentReq';

export { InquiryStatusBadge } from './ui/InquiryStatusBadge';
export { UnreadReplyBadge } from './ui/UnreadReplyBadge';
