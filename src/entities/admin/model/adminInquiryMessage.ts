export type AdminInquiryMessageKind = 'question' | 'reply' | 'memo';

/** `admin_get_inquiry_messages` 행. 내부 메모를 포함한다. */
export type AdminInquiryMessage = {
  id: string;
  inquiryId: string;
  kind: AdminInquiryMessageKind;
  authorId: string;
  authorEmail: string | null;
  body: string;
  attachments: string[];
  createdAt: string;
};
