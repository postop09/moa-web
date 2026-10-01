import type { InquiryStatusFilter } from '@/entities/inquiry';

import { MyInquiriesContent } from './ui/MyInquiriesContent';

export { parseStatusParam } from './lib/parseStatusParam';

type Props = {
  status: InquiryStatusFilter;
};

// 서버 라우트가 parseStatusParam 을 호출하므로 이 파일은 'use client' 로 두지 않는다.
// 클라이언트 경계는 ui/ 의 컴포넌트가 가진다.
export const MyInquiriesPage = ({ status }: Props) => (
  <MyInquiriesContent status={status} />
);

export default MyInquiriesPage;
