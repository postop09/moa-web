import type { Metadata } from 'next';

import { WriteEditPage } from '@/pages/write/edit';

import styles from '@/pages/write/ui/write.module.css';

export const metadata: Metadata = {
  title: '수정하기',
};

type Props = {
  params: Promise<{ transactionId: string }>;
};

const WriteEditRoutePage = async ({ params }: Props) => {
  const { transactionId: rawId } = await params;
  const transactionId = Number(rawId);

  if (!Number.isFinite(transactionId)) {
    return (
      <main className={styles.page}>
        <p className={styles.error}>올바르지 않은 내역입니다.</p>
      </main>
    );
  }

  return <WriteEditPage transactionId={transactionId} />;
};

export default WriteEditRoutePage;
