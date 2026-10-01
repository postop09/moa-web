import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { InquiryDonePage } from '@/pages/inquiryDone';
import { isUuid } from '@/shared/lib';

export const metadata: Metadata = {
  title: '문의 접수 완료',
};

type Props = {
  params: Promise<{ id: string }>;
};

const InquiryDoneRoute = async ({ params }: Props) => {
  const { id } = await params;

  if (!isUuid(id)) notFound();

  return <InquiryDonePage inquiryId={id} />;
};

export default InquiryDoneRoute;
