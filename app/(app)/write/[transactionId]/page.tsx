'use client';

import { use } from 'react';

import { WriteEditPage } from '@/pages/write/edit';

import styles from '@/pages/write/ui/write.module.css';

type Props = {
  params: Promise<{ transactionId: string }>;
};

const WriteEditRoutePage = ({ params }: Props) => {
  const { transactionId: rawId } = use(params);
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
