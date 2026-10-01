'use client';

import { useState } from 'react';

import { PageHeader } from '@/shared/ui';

import styles from './ui/inquiryDetail.module.css';
import { DetailSkeleton } from './ui/DetailState';
import { InquiryDetailView } from './ui/InquiryDetailView';

type Props = {
  inquiryId: string;
};

export const InquiryDetailPage = ({ inquiryId }: Props) => {
  const [isDeleted, setIsDeleted] = useState(false);

  // 삭제된 문의의 캐시는 지워져 있다. 화면을 내려 두지 않으면 구독 중인 조회가 다시 일어난다.
  // 목록 화면으로의 이동과 토스트는 삭제 mutation 이 맡는다.
  if (isDeleted) {
    return (
      <main className={styles.page}>
        <PageHeader title="문의 상세" />
        <DetailSkeleton />
      </main>
    );
  }

  return (
    <InquiryDetailView
      inquiryId={inquiryId}
      onDeleted={() => setIsDeleted(true)}
    />
  );
};

export default InquiryDetailPage;
