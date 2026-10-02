export type ReplyAdminInquiryReq = {
  inquiryId: string;
  body: string;
  /** 문의 작성자 폴더 아래 Storage 경로 */
  attachments: string[];
  /** 답변을 쓰기 시작할 때 화면에 보이던 마지막(메모 제외) 메시지 id */
  expectedLastMessageId: string | null;
  /** 답변을 쓰기 시작할 때 화면에 보이던 문의 updatedAt */
  expectedUpdatedAt: string;
};
