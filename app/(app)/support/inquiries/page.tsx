import type { Metadata } from 'next';

import { MyInquiriesPage, parseStatusParam } from '@/pages/myInquiries';

export const metadata: Metadata = {
  title: '내 문의',
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const InquiriesRoute = async ({ searchParams }: Props) => {
  const { status } = await searchParams;

  return <MyInquiriesPage status={parseStatusParam(status)} />;
};

export default InquiriesRoute;
