export type InquiryMessageKind = 'question' | 'reply' | 'memo';

/** `inquiry-messages` 테이블 행. memo는 사용자에게 조회되지 않는다(RLS). */
export type InquiryMessage = {
  id: string;
  inquiryId: string;
  kind: InquiryMessageKind;
  body: string;
  attachments: string[];
  createdAt: string;
};
