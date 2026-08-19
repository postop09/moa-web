import type { Metadata } from 'next';

import { WriteEditPage } from '@/pages/write/edit';

export const metadata: Metadata = {
  title: '수정하기',
};

type Props = {
  params: Promise<{ transactionId: string }>;
};

const WriteEditRoutePage = async ({ params }: Props) => {
  const { transactionId: rawId } = await params;
  const transactionId = Number(rawId);

  return <WriteEditPage transactionId={transactionId} />;
};

export default WriteEditRoutePage;
