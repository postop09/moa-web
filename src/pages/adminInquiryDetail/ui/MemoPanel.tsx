import type { Ref } from 'react';

import { Button } from '@/shared/ui';

import { MEMO_PANEL_NOTE } from '../config/texts';

import styles from './composer.module.css';
import { ComposerNotice, type Notice } from './ComposerNotice';
import { DraftField } from './DraftField';

type Props = {
  body: string;
  notice: Notice | null;
  isDisabled: boolean;
  isSaving: boolean;
  boxRef: Ref<HTMLTextAreaElement>;
  onBodyChange: (value: string) => void;
  onSave: () => void;
};

export const MemoPanel = ({
  body,
  notice,
  isDisabled,
  isSaving,
  boxRef,
  onBodyChange,
  onSave,
}: Props) => (
  <>
    <p className={styles.panelNote}>{MEMO_PANEL_NOTE}</p>
    <DraftField
      label="메모 내용"
      placeholder="운영자끼리만 보는 메모를 남기세요"
      value={body}
      readOnly={isSaving}
      textareaRef={boxRef}
      onChange={onBodyChange}
    />
    {notice ? <ComposerNotice notice={notice} /> : null}
    <div className={styles.actions}>
      <Button loading={isSaving} aria-disabled={isDisabled} onClick={onSave}>
        메모 저장
      </Button>
    </div>
  </>
);
