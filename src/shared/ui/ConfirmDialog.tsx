'use client';

import type { ReactNode } from 'react';

import { getErrorMessage } from '@/shared/lib';

import { Button } from './Button';
import { Modal } from './Modal';
import styles from './modal.module.css';

type Props = {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: Error | null;
  fallbackError: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  pendingLabel,
  isPending,
  error,
  fallbackError,
  onCancel,
  onConfirm,
}: Props) => {
  return (
    <Modal title={title} onClose={onCancel} closeDisabled={isPending}>
      <div className={styles.body}>
        <p className={styles.confirmText}>{message}</p>
        {error ? (
          <p className={styles.error}>
            {getErrorMessage(error, fallbackError)}
          </p>
        ) : null}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            취소
          </Button>
          <Button
            variant="danger"
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
