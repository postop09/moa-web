import { EditInquiryLoader } from './ui/EditInquiryLoader';
import { InquiryWriteForm } from './ui/InquiryWriteForm';
import type { WriteMode } from './lib/parseWriteMode';

export { parseWriteMode } from './lib/parseWriteMode';
export type { WriteMode } from './lib/parseWriteMode';

// 서버 라우트가 parseWriteMode 를 호출하므로 이 파일은 'use client' 로 두지 않는다.
// 클라이언트 경계는 ui/ 의 각 컴포넌트가 가진다.
export const InquiryWritePage = (props: WriteMode) =>
  props.mode === 'edit' ? (
    <EditInquiryLoader inquiryId={props.inquiryId} />
  ) : (
    <InquiryWriteForm target={props} />
  );

export default InquiryWritePage;
