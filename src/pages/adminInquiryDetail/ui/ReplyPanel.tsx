import type { Ref } from 'react';

import type { ImageAttachment } from '@/features/inquiry';
import { Button } from '@/shared/ui';

import { REPLY_PANEL_NOTE, UNCATEGORIZED_BANNER_TEXT } from '../config/texts';

import styles from './composer.module.css';
import { ComposerNotice, type Notice } from './ComposerNotice';
import { DraftField } from './DraftField';
import { PhotoPicker } from './PhotoPicker';

type Props = {
  body: string;
  photos: ImageAttachment[];
  maxPhotos: number;
  notice: Notice | null;
  /** 충돌 뒤 새로고침을 마친 안내. 평문이다. */
  followUp: string | null;
  /** 등록을 막는 이유 안내. 없으면 막히지 않았다. */
  blockedHint: string | null;
  hintId: string;
  /** 미분류 배너의 id. 답변 버튼이 이 배너로 설명된다. */
  bannerId: string;
  isBlocked: boolean;
  isUncategorized: boolean;
  isSubmitting: boolean;
  boxRef: Ref<HTMLTextAreaElement>;
  buttonRef: Ref<HTMLButtonElement>;
  onBodyChange: (value: string) => void;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
  onSubmit: () => void;
  onRefresh: () => void;
  onFocusCategory: () => void;
};

export const ReplyPanel = ({
  body,
  photos,
  maxPhotos,
  notice,
  followUp,
  blockedHint,
  hintId,
  bannerId,
  isBlocked,
  isUncategorized,
  isSubmitting,
  boxRef,
  buttonRef,
  onBodyChange,
  onAddPhotos,
  onRemovePhoto,
  onSubmit,
  onRefresh,
  onFocusCategory,
}: Props) => (
  <>
    <p className={styles.panelNote}>{REPLY_PANEL_NOTE}</p>
    {isUncategorized ? (
      <div id={bannerId} className={styles.banner}>
        <p className={styles.bannerText}>{UNCATEGORIZED_BANNER_TEXT}</p>
        <Button
          variant="secondary"
          size="sm"
          className={styles.bannerButton}
          onClick={onFocusCategory}
        >
          지정하러 가기
        </Button>
      </div>
    ) : null}
    <DraftField
      label="답변 내용"
      placeholder="답변을 입력하세요"
      value={body}
      readOnly={isSubmitting}
      textareaRef={boxRef}
      onChange={onBodyChange}
    />
    <PhotoPicker
      photos={photos}
      max={maxPhotos}
      isLocked={isSubmitting}
      onAdd={onAddPhotos}
      onRemove={onRemovePhoto}
    />
    {notice ? <ComposerNotice notice={notice} onRefresh={onRefresh} /> : null}
    {followUp ? <p className={styles.followUp}>{followUp}</p> : null}
    {blockedHint ? (
      <p id={hintId} className={styles.hint}>
        {blockedHint}
      </p>
    ) : null}
    <div className={styles.actions}>
      <Button
        ref={buttonRef}
        loading={isSubmitting}
        aria-disabled={isBlocked}
        aria-describedby={
          isUncategorized ? bannerId : blockedHint ? hintId : undefined
        }
        onClick={onSubmit}
      >
        답변 등록
      </Button>
    </div>
  </>
);
