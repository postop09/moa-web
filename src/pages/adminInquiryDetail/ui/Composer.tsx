'use client';

import { useId, useRef, useState } from 'react';

import type { AdminInquiry, AdminInquiryMessage } from '@/entities/admin';
import { useBeforeUnloadGuard, useRestoreFocus } from '@/shared/lib';

import {
  BODY_MAX,
  CONFLICT_FOLLOW_UP_TEXT,
  MESSAGES_PENDING_HINT,
  REFETCHING_HINT,
  REPLY_SENT_ANNOUNCEMENT,
} from '../config/texts';
import { getReplyFailure } from '../lib/getFailureMessage';
import { getLastMessageId } from '../lib/getLastMessageId';
import { trimText } from '../lib/trimText';
import { useMemoSave } from '../model/useMemoSave';
import { useReplyPhotos } from '../model/useReplyPhotos';
import { useReplySubmit, type ReplySnapshot } from '../model/useReplySubmit';

import styles from './composer.module.css';
import type { Notice } from './ComposerNotice';
import {
  ComposerTabs,
  getPanelId,
  getTabId,
  type ComposerTab,
} from './ComposerTabs';
import { MemoPanel } from './MemoPanel';
import { ReplyPanel } from './ReplyPanel';
import { ReplyPreviewDialog } from './ReplyPreviewDialog';

type Props = {
  inquiry: AdminInquiry;
  /** 아직 못 받았거나 실패하면 undefined. 기대 메시지 id 를 모르므로 답변 등록을 막는다. */
  messages: AdminInquiryMessage[] | undefined;
  /** 문의·메시지를 열거나 다시 받는 중. 끝나기 전에는 낡은 기대값으로 등록하지 못하게 막는다. */
  isSyncing: boolean;
  announce: (message: string) => void;
  onFocusCategory: () => void;
  /**
   * 문의·메시지를 다시 불러온다. 이미 진행 중인 조회가 있으면 그 끝을 기다린다.
   * 둘 다 성공하면 true. scrollToLatest 를 주면 끝난 뒤 가장 새 카드로 스크롤한다.
   */
  onRefresh: (options?: { scrollToLatest?: boolean }) => Promise<boolean>;
};

const isValidBody = (value: string) =>
  trimText(value) !== '' && value.length <= BODY_MAX;

export const Composer = ({
  inquiry,
  messages,
  isSyncing,
  announce,
  onFocusCategory,
  onRefresh,
}: Props) => {
  const idPrefix = useId();
  const hintId = `${idPrefix}-hint`;
  const bannerId = `${idPrefix}-banner`;
  const [tab, setTab] = useState<ComposerTab>('reply');
  const [replyBody, setReplyBody] = useState('');
  const [memoBody, setMemoBody] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCatchingUp, setIsCatchingUp] = useState(false);
  const replyBoxRef = useRef<HTMLTextAreaElement>(null);
  const memoBoxRef = useRef<HTMLTextAreaElement>(null);
  const replyButtonRef = useRef<HTMLButtonElement>(null);
  // 미리보기를 연 시점에 화면이 알던 충돌 검사 기준. 확인하면 이 값으로 등록한다.
  const snapshotRef = useRef<ReplySnapshot | null>(null);

  const photoDraft = useReplyPhotos({
    onReject: (message) => {
      setFollowUp(null);
      setNotice({ message, isConflict: false });
    },
    onChange: announce,
  });
  const replySubmit = useReplySubmit({ inquiry, messages });
  const memo = useMemoSave({
    inquiryId: inquiry.id,
    announce,
    onStart: () => setNotice(null),
    onSaved: () => {
      setMemoBody('');
      memoBoxRef.current?.focus();
    },
    onFailure: (message) => showNotice({ message, isConflict: false }),
  });

  useBeforeUnloadGuard(
    trimText(replyBody) !== '' ||
      trimText(memoBody) !== '' ||
      photoDraft.photos.length > 0,
  );
  useRestoreFocus(isPreviewOpen, () => replyButtonRef.current);

  const isUncategorized = !inquiry.category;
  // 미분류 안내는 답변 영역의 배너가 맡는다. 여기서는 그 밖의 막는 이유만 안내한다.
  const blockedHint =
    messages === undefined
      ? MESSAGES_PENDING_HINT
      : isSyncing || isCatchingUp
        ? REFETCHING_HINT
        : null;
  const isReplyBlocked =
    isUncategorized || blockedHint !== null || !isValidBody(replyBody);

  const showNotice = (next: Notice | null) => {
    setFollowUp(null);
    setNotice(next);
  };

  const handleAddPhotos = (files: File[]) => {
    if (photoDraft.add(files)) setNotice(null);
  };

  const handleSelectTab = (next: ComposerTab) => {
    setTab(next);
    setNotice(null);
  };

  const handleReplyClick = () => {
    if (isUncategorized) {
      onFocusCategory();

      return;
    }

    if (isReplyBlocked) return;

    snapshotRef.current = {
      expectedLastMessageId: getLastMessageId(messages ?? []),
      expectedUpdatedAt: inquiry.updatedAt,
    };
    setIsPreviewOpen(true);
  };

  const handleConfirmReply = async () => {
    const snapshot = snapshotRef.current;

    setIsPreviewOpen(false);
    setNotice(null);
    announce('');

    if (!snapshot) return;

    try {
      const isSent = await replySubmit.submit({
        body: trimText(replyBody),
        files: photoDraft.photos.map((photo) => photo.file),
        snapshot,
      });

      if (!isSent) return;

      photoDraft.clear();
      setReplyBody('');
      setFollowUp(null);
      announce(REPLY_SENT_ANNOUNCEMENT);
      replyBoxRef.current?.focus();
    } catch (error) {
      const failure = getReplyFailure(error);

      showNotice(failure);

      // 충돌이면 최신 상태를 받을 때까지 낡은 기대값으로 다시 등록하지 못하게 막는다.
      if (failure.isConflict) {
        setIsCatchingUp(true);
        void onRefresh().finally(() => setIsCatchingUp(false));
      }
    }
  };

  // 충돌 안내의 새로고침 버튼은 눌리면 사라지므로 입력창으로 포커스를 옮겨 둔다.
  // 끝나면 평문 안내로 바꾸고 새 답변 카드를 보여 준다. 받지 못했으면 충돌 안내를 되살린다.
  const handleRefresh = async () => {
    const previous = notice;

    setNotice(null);
    replyBoxRef.current?.focus();

    const isRefreshed = await onRefresh({ scrollToLatest: true });

    if (isRefreshed) setFollowUp(CONFLICT_FOLLOW_UP_TEXT);
    else setNotice(previous);
  };

  return (
    <section className={styles.composer} aria-label="답변 작성">
      <ComposerTabs
        selected={tab}
        idPrefix={idPrefix}
        onSelect={handleSelectTab}
      />
      <div
        role="tabpanel"
        id={getPanelId(idPrefix)}
        aria-labelledby={getTabId(idPrefix, tab)}
        data-kind={tab === 'memo' ? 'memo' : undefined}
        className={styles.panel}
      >
        {tab === 'reply' ? (
          <ReplyPanel
            body={replyBody}
            photos={photoDraft.photos}
            maxPhotos={photoDraft.max}
            notice={notice}
            followUp={followUp}
            blockedHint={blockedHint}
            hintId={hintId}
            bannerId={bannerId}
            isBlocked={isReplyBlocked}
            isUncategorized={isUncategorized}
            isSubmitting={replySubmit.isSubmitting}
            boxRef={replyBoxRef}
            buttonRef={replyButtonRef}
            onBodyChange={setReplyBody}
            onAddPhotos={handleAddPhotos}
            onRemovePhoto={photoDraft.remove}
            onSubmit={handleReplyClick}
            onRefresh={() => void handleRefresh()}
            onFocusCategory={onFocusCategory}
          />
        ) : (
          <MemoPanel
            body={memoBody}
            notice={notice}
            isDisabled={!isValidBody(memoBody)}
            isSaving={memo.isSaving}
            boxRef={memoBoxRef}
            onBodyChange={setMemoBody}
            onSave={() => {
              if (isValidBody(memoBody)) void memo.save(memoBody);
            }}
          />
        )}
      </div>
      {isPreviewOpen ? (
        <ReplyPreviewDialog
          body={trimText(replyBody)}
          photoCount={photoDraft.photos.length}
          onCancel={() => setIsPreviewOpen(false)}
          onConfirm={handleConfirmReply}
        />
      ) : null}
    </section>
  );
};
