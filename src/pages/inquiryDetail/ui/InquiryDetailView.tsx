'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  useDeleteInquiry,
  useInquiry,
  useInquiryMessages,
} from '@/features/inquiry';
import { useSafeBack } from '@/shared/lib';
import { PageHeader, useToast } from '@/shared/ui';

import { INQUIRIES_PATH } from '../config/texts';
import { useCloseAction } from '../model/useCloseAction';
import { useMarkReadOnce } from '../model/useMarkReadOnce';
import { useRateAction } from '../model/useRateAction';
import { useRestoreFocus } from '../model/useRestoreFocus';

import { BottomBar } from './BottomBar';
import { CloseInquiryDialog } from './CloseInquiryDialog';
import { DeleteInquiryDialog } from './DeleteInquiryDialog';
import { DetailError, DetailSkeleton, PendingQuestion } from './DetailState';
import { DetailHeaderActions } from './DetailHeaderActions';
import styles from './inquiryDetail.module.css';
import { InquiryMeta } from './InquiryMeta';
import { MessageThread } from './MessageThread';
import { RatingSection } from './RatingSection';

type Props = {
  inquiryId: string;
  /** 삭제가 끝났다. 호출부가 이 화면을 내려 조회가 다시 일어나지 않게 한다. */
  onDeleted: () => void;
};

export const InquiryDetailView = ({ inquiryId, onDeleted }: Props) => {
  const router = useRouter();
  const goBack = useSafeBack(INQUIRIES_PATH);
  const showToast = useToast((state) => state.showToast);

  const inquiryQuery = useInquiry(inquiryId, { retry: 1 });
  const messagesQuery = useInquiryMessages(inquiryId);
  const inquiry = inquiryQuery.data;
  const messages = messagesQuery.data;

  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteFailed, setIsDeleteFailed] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const newInquiryRef = useRef<HTMLAnchorElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeRequestedRef = useRef(false);
  const deletingRef = useRef(false);
  const missingHandledRef = useRef(false);

  const hasReply = messages?.some((message) => message.kind === 'reply');
  useMarkReadOnce(
    inquiryId,
    inquiry?.hasUnreadReply,
    messagesQuery.isSuccess && hasReply === true,
  );

  const closeAction = useCloseAction(inquiryId, {
    onSuccess: () => setIsCloseOpen(false),
    // 실패한 요청이 나중에 다른 경로로 closed 가 된 화면의 포커스를 빼앗지 않게 한다.
    onFailure: () => {
      closeRequestedRef.current = false;
    },
  });
  const rateAction = useRateAction(inquiryId);
  const deleteMutation = useDeleteInquiry({
    // 화면이 사라져도 실행되도록 mutation 옵션에 둔다.
    onSuccess: () => {
      showToast('문의를 삭제했어요.');
      router.replace(INQUIRIES_PATH);
    },
  });

  useRestoreFocus(isDeleteOpen, () => deleteButtonRef.current);
  useRestoreFocus(isCloseOpen, () => closeButtonRef.current);

  const isMissing = inquiry === null;
  useEffect(() => {
    if (!isMissing || missingHandledRef.current) return;

    missingHandledRef.current = true;
    showToast('삭제된 문의예요.');
    router.replace(INQUIRIES_PATH);
  }, [isMissing, router, showToast]);

  const status = inquiry
    ? closeAction.isClosed
      ? 'closed'
      : inquiry.status
    : null;

  // 종결하면 '해결됐어요' 버튼이 사라지므로 다이얼로그가 닫힌 뒤 '새 문의하기' 로 포커스를 옮긴다.
  // 결과는 이 포커스 이동으로 한 번만 안내한다(live region 에는 싣지 않는다).
  const isClosedNow = status === 'closed';
  useEffect(() => {
    if (isClosedNow && !isCloseOpen && closeRequestedRef.current) {
      closeRequestedRef.current = false;
      newInquiryRef.current?.focus();
    }
  }, [isClosedNow, isCloseOpen]);

  const handleConfirmClose = () => {
    closeRequestedRef.current = true;
    closeAction.close();
  };

  const handleCancelClose = () => {
    setIsCloseOpen(false);
    closeAction.resetFailure();
  };

  const handleDelete = () => {
    if (deletingRef.current) return;

    deletingRef.current = true;
    setIsDeleteFailed(false);
    deleteMutation
      .mutateAsync({ inquiryId })
      .then(onDeleted)
      .catch(() => setIsDeleteFailed(true))
      .finally(() => {
        deletingRef.current = false;
      });
  };

  const handleCancelDelete = () => {
    setIsDeleteOpen(false);
    setIsDeleteFailed(false);
  };

  // update_inquiry RPC 는 답변 대기 중이고 답변이 없을 때만 허용한다.
  const canEdit = status === 'waiting' && messages !== undefined && !hasReply;

  const retry = () => {
    void inquiryQuery.refetch();
    void messagesQuery.refetch();
  };

  const renderThread = () => {
    if (!inquiry) return null;
    if (!messages) {
      return (
        <PendingQuestion
          title={inquiry.title}
          isError={messagesQuery.isError}
          onRetry={() => void messagesQuery.refetch()}
        />
      );
    }

    return <MessageThread title={inquiry.title} messages={messages} />;
  };

  // 입력은 답변이 있고 답변 완료·종결일 때만. 저장된 별점은 상태와 무관하게 읽기 전용으로 보인다.
  const canRate =
    hasReply === true && (status === 'answered' || status === 'closed');
  const showRating =
    inquiry?.rating != null || rateAction.savedRating !== null || canRate;

  const renderBody = () => {
    if (inquiryQuery.isError && inquiry === undefined) {
      return <DetailError onRetry={retry} />;
    }
    if (!inquiry || !status) return <DetailSkeleton />;

    return (
      <div className={styles.content}>
        <InquiryMeta inquiry={inquiry} status={status} />
        {renderThread()}
        {showRating ? (
          <RatingSection
            rating={inquiry.rating}
            pendingRating={rateAction.pendingRating}
            savedRating={rateAction.savedRating}
            isFailed={rateAction.isFailed}
            onRate={rateAction.rate}
          />
        ) : null}
      </div>
    );
  };

  return (
    <main className={styles.page}>
      <PageHeader
        title="문의 상세"
        onBack={goBack}
        right={
          inquiry ? (
            <DetailHeaderActions
              inquiryId={inquiryId}
              canEdit={canEdit}
              deleteRef={deleteButtonRef}
              onDelete={() => setIsDeleteOpen(true)}
            />
          ) : null
        }
      />
      {/* 결과 안내는 포커스 이동으로 한다. 영역은 항상 마운트해 두되 비워 둔다. */}
      <p className="srOnly" role="status" />

      {renderBody()}

      {inquiry && status ? (
        <BottomBar
          inquiryId={inquiryId}
          status={status}
          newInquiryRef={newInquiryRef}
          closeRef={closeButtonRef}
          onClose={() => setIsCloseOpen(true)}
        />
      ) : null}

      {isCloseOpen ? (
        <CloseInquiryDialog
          isPending={closeAction.isPending}
          isFailed={closeAction.isFailed}
          onCancel={handleCancelClose}
          onConfirm={handleConfirmClose}
        />
      ) : null}

      {isDeleteOpen ? (
        <DeleteInquiryDialog
          mayHaveReply={
            messages === undefined || hasReply === true || status === 'answered'
          }
          isPending={deleteMutation.isPending}
          isFailed={isDeleteFailed}
          onCancel={handleCancelDelete}
          onConfirm={handleDelete}
        />
      ) : null}
    </main>
  );
};
