import type { AdminInquiryFilters } from '@/entities/admin';

import { AdminInquiriesContent } from './ui/AdminInquiriesContent';

type Props = {
  filters: AdminInquiryFilters;
};

// 서버 라우트가 필터를 파싱해 넘기므로 이 파일은 'use client' 로 두지 않는다.
// 클라이언트 경계는 ui/ 의 컴포넌트가 가진다.
export const AdminInquiriesPage = ({ filters }: Props) => (
  <AdminInquiriesContent filters={filters} />
);

export default AdminInquiriesPage;
