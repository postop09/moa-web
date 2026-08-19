'use client';

import { useEffect, useId, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import styles from './modal.module.css';

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
  const titleId = useId();
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
    <div className={styles.root}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="닫기"
        disabled={closeDisabled}
        onClick={onClose}
      />
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <h3 id={titleId} className={styles.title}>
            {title}
          </h3>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
};
