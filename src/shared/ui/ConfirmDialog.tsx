'use client';

import type { ReactNode } from 'react';

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
            {error instanceof Error ? error.message : fallbackError}
          </p>
        ) : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isPending}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
