'use client';

import { useId, useRef, type ReactNode } from 'react';

import { getErrorMessage } from '@/shared/lib';

import { Button } from './Button';
import { Modal } from './Modal';
import styles from './modal.module.css';

type Props = {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  /** 기본값 '취소' */
  cancelLabel?: string;
  /** 'danger'(기본)는 되돌릴 수 없는 작업, 'default'는 일반 확인. */
  tone?: 'danger' | 'default';
  /** 'subtle'은 확인 버튼을 덜 눈에 띄게 한다(이탈 확인 등). */
  confirmEmphasis?: 'primary' | 'subtle';
  /** 열릴 때 포커스할 버튼. 기본값은 안전한 쪽인 'cancel'. */
  initialFocus?: 'cancel' | 'confirm';
  pendingLabel?: string;
  isPending?: boolean;
  error?: Error | null;
  fallbackError?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  cancelLabel = '취소',
  tone = 'danger',
  confirmEmphasis = 'primary',
  initialFocus = 'cancel',
  pendingLabel,
  isPending = false,
  error = null,
  fallbackError = '',
  onCancel,
  onConfirm,
}: Props) => {
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      title={title}
      onClose={onCancel}
      closeDisabled={isPending}
      role="alertdialog"
      descriptionId={messageId}
      initialFocus={initialFocus === 'confirm' ? confirmRef : cancelRef}
    >
      <div className={styles.body}>
        <p id={messageId} className={styles.confirmText}>
          {message}
        </p>
        {error ? (
          <p className={styles.error} role="alert">
            {getErrorMessage(error, fallbackError)}
          </p>
        ) : null}
        <div className={styles.actions}>
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={tone === 'danger' ? 'danger' : 'primary'}
            data-emphasis={confirmEmphasis}
            onClick={onConfirm}
            loading={isPending}
            loadingLabel={pendingLabel}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
