'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getAdminErrorKind } from '@/entities/admin';
import {
  useAdminInquiry,
  useAdminInquiryMessages,
  useAdminOperators,
  useAdminRecentInquiries,
} from '@/features/adminInquiry';
import { useSafeBack } from '@/shared/lib';

import { ADMIN_INQUIRIES_PATH, CLAIM_ANNOUNCEMENT } from '../config/texts';
import { getLastMessageId } from '../lib/getLastMessageId';
import { scrollIntoViewSafely } from '../lib/scrollIntoViewSafely';
import { useCurrentUserId } from '../model/useCurrentUserId';
import { useOpenOnce } from '../model/useOpenOnce';

import styles from './adminInquiryDetail.module.css';
import { ClosedNotice } from './ClosedNotice';
import { Composer } from './Composer';
import { DetailHeader } from './DetailHeader';
import {
  DetailError,
  DetailNotFound,
  DetailSkeleton,
  ThreadState,
} from './DetailState';
import { MessageThread } from './MessageThread';
import { SidePanel } from './SidePanel';

type Props = {
  inquiryId: string;
  /** 미리보기로 열었다. 답변 대기 문의를 열지 않는다. */
  peek: boolean;
};

export const AdminInquiryDetailView = ({ inquiryId, peek }: Props) => {
  const goBack = useSafeBack(ADMIN_INQUIRIES_PATH);
  const inquiryQuery = useAdminInquiry(inquiryId);
  const messagesQuery = useAdminInquiryMessages(inquiryId);
  const operatorsQuery = useAdminOperators();
  const recentQuery = useAdminRecentInquiries(inquiryId);
  const inquiry = inquiryQuery.data;
  const messages = messagesQuery.data;

  // 페이지에 하나뿐인 결과 안내 영역. 항상 마운트해 두고 내용만 바꾼다.
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const threadRef = useRef<HTMLOListElement>(null);
  const scrollTargetRef = useRef<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);

  // 낡은 캐시가 아니라 마운트 뒤 서버에서 새로 받은 결과로만 열지 정한다.
  const isFresh = inquiryQuery.isSuccess && inquiryQuery.isFetchedAfterMount;
  const currentUser = useCurrentUserId();
  const { isOpening, isFailed: isOpenFailed } = useOpenOnce({
    inquiryId,
    peek,
    freshStatus: isFresh ? inquiry?.status : undefined,
    resolveUserId: currentUser.resolve,
    onClaimed: () => announce(CLAIM_ANNOUNCEMENT),
  });
  const isSyncing =
    isOpening || inquiryQuery.isFetching || messagesQuery.isFetching;

  // 이미 진행 중인 조회가 있으면 새로 시작하지 않고 그 끝을 기다린다.
  const refresh = async ({ scrollToLatest = false } = {}) => {
    const [inquiryResult, messagesResult] = await Promise.all([
      inquiryQuery.refetch({ cancelRefetch: false }),
      messagesQuery.refetch({ cancelRefetch: false }),
    ]);

    // 새 카드는 다음 렌더에 나타나므로 대상만 적어 두고 아래 이펙트가 스크롤한다.
    if (scrollToLatest && messagesResult.data) {
      scrollTargetRef.current = getLastMessageId(messagesResult.data);
      setScrollTick((tick) => tick + 1);
    }

    return !inquiryResult.isError && !messagesResult.isError;
  };

  useEffect(() => {
    const targetId = scrollTargetRef.current;

    if (targetId === null) return;

    const card = Array.from(threadRef.current?.children ?? []).find(
      (item) => item.getAttribute('data-message-id') === targetId,
    );

    if (!card) return;

    scrollTargetRef.current = null;
    scrollIntoViewSafely(card);
  }, [scrollTick, messages]);

  const retryAll = () => {
    void inquiryQuery.refetch();
    void messagesQuery.refetch();
  };

  const focusTitle = useCallback(() => titleRef.current?.focus(), []);

  const focusCategory = () => {
    categorySelectRef.current?.focus();
    scrollIntoViewSafely(categorySelectRef.current);
  };

  const renderBody = () => {
    if (inquiryQuery.isError && inquiry === undefined) {
      const kind = getAdminErrorKind(inquiryQuery.error);

      if (kind === 'not_found') return <DetailNotFound />;

      return (
        <DetailError isPermission={kind === 'forbidden'} onRetry={retryAll} />
      );
    }

    if (!inquiry) return <DetailSkeleton />;

    return (
      <div className={styles.layout}>
        <div className={styles.main}>
          {messages ? (
            <MessageThread messages={messages} listRef={threadRef} />
          ) : (
            <ThreadState
              isError={messagesQuery.isError}
              onRetry={() => void messagesQuery.refetch()}
            />
          )}
          {inquiry.status === 'closed' ? (
            <ClosedNotice reason={inquiry.closeReason} />
          ) : (
            <Composer
              inquiry={inquiry}
              messages={messages}
              isSyncing={isSyncing}
              announce={announce}
              onFocusCategory={focusCategory}
              onRefresh={refresh}
            />
          )}
        </div>
        <SidePanel
          inquiry={inquiry}
          operators={operatorsQuery.data}
          isOperatorsError={operatorsQuery.isError}
          recent={recentQuery.data}
          isRecentError={recentQuery.isError}
          categorySelectRef={categorySelectRef}
          announce={announce}
          onClosed={focusTitle}
        />
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <DetailHeader
        inquiry={inquiry ?? null}
        peek={peek}
        currentUserId={currentUser.userId}
        isOpenFailed={isOpenFailed}
        titleRef={titleRef}
        onBack={goBack}
      />
      <p className="srOnly" role="status">
        {announcement}
      </p>
      {renderBody()}
    </div>
  );
};
