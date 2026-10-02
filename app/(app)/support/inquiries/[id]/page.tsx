import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { InquiryDetailPage } from '@/pages/inquiryDetail';
import { isUuid } from '@/shared/lib';

export const metadata: Metadata = {
  title: '문의 상세',
};

type Props = {
  params: Promise<{ id: string }>;
};

const InquiryDetailRoute = async ({ params }: Props) => {
  const { id } = await params;

  if (!isUuid(id)) notFound();

  return <InquiryDetailPage inquiryId={id} />;
};

export default InquiryDetailRoute;
