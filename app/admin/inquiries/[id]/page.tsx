import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AdminInquiryDetailPage } from '@/pages/adminInquiryDetail';
import { isUuid } from '@/shared/lib';

export const metadata: Metadata = {
  title: '문의 상세',
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ peek?: string | string[] }>;
};

const AdminInquiryDetailRoute = async ({ params, searchParams }: Props) => {
  const { id } = await params;
  const { peek } = await searchParams;

  if (!isUuid(id)) notFound();

  return <AdminInquiryDetailPage inquiryId={id} peek={peek === '1'} />;
};

export default AdminInquiryDetailRoute;
