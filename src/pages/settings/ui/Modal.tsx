'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import styles from '../settings.module.css';

const subscribeClient = () => () => {};

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeDisabled?: boolean;
};

export const Modal = ({
  title,
  onClose,
  children,
  closeDisabled = false,
}: Props) => {
  const mounted = useSyncExternalStore(
    subscribeClient,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDisabled, mounted, onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className={styles.modalRoot}>
      <button
        type="button"
        className={styles.modalBackdrop}
        aria-label="닫기"
        disabled={closeDisabled}
        onClick={onClose}
      />
      <div
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <header className={styles.formHeader}>
          <h3 id="settings-modal-title" className={styles.formTitle}>
            {title}
          </h3>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
};
