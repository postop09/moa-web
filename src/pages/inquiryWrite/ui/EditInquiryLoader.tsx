'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useInquiry, useInquiryMessages } from '@/features/inquiry';
import { useSafeBack } from '@/shared/lib';
import { Button, PageHeader, useToast } from '@/shared/ui';

import { EDIT_LOCKED_MESSAGE } from '../lib/getSubmitFailure';

import { InquiryWriteForm } from './InquiryWriteForm';
import styles from './inquiryWrite.module.css';
import { WriteSkeleton } from './WriteSkeleton';

type Props = {
  inquiryId: string;
};

export const EditInquiryLoader = ({ inquiryId }: Props) => {
  const router = useRouter();
  const detailPath = `/support/inquiries/${inquiryId}`;
  const goBack = useSafeBack(detailPath);
  const showToast = useToast((state) => state.showToast);
  const inquiryQuery = useInquiry(inquiryId);
  const messagesQuery = useInquiryMessages(inquiryId);

  const inquiry = inquiryQuery.data;
  const messages = messagesQuery.data;
  const firstQuestion = messages
    ?.filter((message) => message.kind === 'question')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

  const isLoading = inquiryQuery.isLoading || messagesQuery.isLoading;
  const isFetchError = inquiryQuery.isError || messagesQuery.isError;

  const isMissing = !isLoading && !isFetchError && inquiry === null;
  // update_inquiry RPC 는 답변 대기(waiting) 상태이고 답변이 없을 때만 허용한다.
  const isLocked =
    !!inquiry &&
    (inquiry.status !== 'waiting' ||
      !!messages?.some((message) => message.kind === 'reply'));
  // 첫 질문이 없으면 채울 내용이 없으니 폼을 열지 않는다.
  const isMissingQuestion =
    !!inquiry && !!messages && !isLocked && !firstQuestion;
  const isError =
    !isMissing && !isLocked && (isFetchError || isMissingQuestion);

  useEffect(() => {
    if (isMissing) {
      showToast('삭제된 문의예요.');
      router.replace('/support/inquiries');
    } else if (isLocked) {
      showToast(EDIT_LOCKED_MESSAGE);
      router.replace(detailPath);
    }
  }, [isMissing, isLocked, detailPath, router, showToast]);

  const refetch = () => {
    void inquiryQuery.refetch();
    void messagesQuery.refetch();
  };

  if (inquiry && firstQuestion && !isLocked && !isError && !isLoading) {
    return (
      <InquiryWriteForm
        target={{ mode: 'edit', inquiryId }}
        initialTitle={inquiry.title}
        initialBody={firstQuestion.body}
      />
    );
  }

  return (
    <main className={styles.page}>
      <PageHeader title="문의 수정" onBack={goBack} />
      {isError ? (
        <div className={styles.state} role="alert">
          <p>문의를 불러오지 못했어요.</p>
          <Button variant="secondary" onClick={refetch}>
            다시 시도
          </Button>
        </div>
      ) : (
        <WriteSkeleton />
      )}
    </main>
  );
};
