import type { Metadata } from 'next';

import { parseAdminInquiryFilters } from '@/entities/admin';
import { AdminInquiriesPage } from '@/pages/adminInquiries';

export const metadata: Metadata = {
  title: '문의 관리',
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const AdminInquiriesRoute = async ({ searchParams }: Props) => {
  const filters = parseAdminInquiryFilters(await searchParams);

  return <AdminInquiriesPage filters={filters} />;
};

export default AdminInquiriesRoute;
