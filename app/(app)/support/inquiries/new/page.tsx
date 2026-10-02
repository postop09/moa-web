import type { Metadata } from 'next';

import { InquiryWritePage, parseWriteMode } from '@/pages/inquiryWrite';

export const metadata: Metadata = {
  title: '1:1 문의하기',
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const NewInquiryPage = async ({ searchParams }: Props) => {
  const mode = parseWriteMode(await searchParams);

  return <InquiryWritePage {...mode} />;
};

export default NewInquiryPage;
