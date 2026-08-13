'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import styles from './write.module.css';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        aria-labelledby="write-modal-title"
      >
        <header className={styles.modalHeader}>
          <h3 id="write-modal-title" className={styles.modalTitle}>
            {title}
          </h3>
          <button
            type="button"
            className={styles.textButton}
            onClick={onClose}
            disabled={closeDisabled}
          >
            닫기
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
};
