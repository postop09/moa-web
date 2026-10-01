'use client';

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

import styles from './modal.module.css';

const subscribeClient = () => () => {};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
].join(',');

const getFocusable = (panel: HTMLElement) =>
  Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.tabIndex >= 0 && !element.hasAttribute('inert'),
  );

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeDisabled?: boolean;
  elevated?: boolean;
  /** 열릴 때 포커스할 요소. 없으면 패널의 첫 번째 포커스 가능 요소. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** 'alertdialog'는 확인을 요구하는 대화상자. */
  role?: 'dialog' | 'alertdialog';
  /** 대화상자 설명 요소 id (aria-describedby). */
  descriptionId?: string;
  /** 'viewer'는 사진처럼 화면을 가득 채우는 어두운 패널. */
  variant?: 'default' | 'viewer';
};

export const Modal = ({
  title,
  onClose,
  children,
  closeDisabled = false,
  elevated = false,
  initialFocus,
  role = 'dialog',
  descriptionId,
  variant = 'default',
}: Props) => {
  const titleId = useId();
  const mounted = useSyncExternalStore(
    subscribeClient,
    () => true,
    () => false,
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const initialFocusRef = useRef(initialFocus);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
    initialFocusRef.current = initialFocus;
  });

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const target =
      initialFocusRef.current?.current ??
      (panel ? getFocusable(panel)[0] : null) ??
      panel;
    target?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!closeDisabledRef.current) {
          onCloseRef.current();
        }

        return;
      }

      if (event.key !== 'Tab' || !panel) {
        return;
      }

      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();

        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);

      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className={`${styles.root} ${elevated ? styles.rootElevated : ''}`}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="닫기"
        tabIndex={-1}
        disabled={closeDisabled}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`${styles.dialog} ${variant === 'viewer' ? styles.dialogViewer : ''}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
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
