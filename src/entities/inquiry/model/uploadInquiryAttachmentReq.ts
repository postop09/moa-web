export type UploadInquiryAttachmentReq = {
  userId: string;
  /** 클라이언트가 초안/문의 단위로 만든 uuid (crypto.randomUUID). 문의 id가 아니다. */
  folderId: string;
  file: File;
};
