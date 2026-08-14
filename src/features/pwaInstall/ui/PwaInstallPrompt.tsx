'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { usePwaInstallPrompt } from '../model/usePwaInstallPrompt';
import styles from './pwaInstallPrompt.module.css';

export const PwaInstallPrompt = () => {
  const { isOpen, platform, dismiss, promptInstall } = usePwaInstallPrompt();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismiss, isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.modalRoot}>
      <div className={styles.modalBackdrop} />
      <div
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        <header className={styles.header}>
          <h3 id="pwa-install-title" className={styles.title}>
            홈 화면에 추가
          </h3>
        </header>
        <div className={styles.body}>
          <p className={styles.description}>
            모아를 앱처럼 사용하기 위해 홈 화면에 아이콘을 추가하세요.
          </p>
          {platform === 'ios' ? (
            <ol className={styles.steps}>
              <li>하단 공유 버튼을 탭하세요.</li>
              <li>{'"홈 화면에 추가"를 선택하세요.'}</li>
            </ol>
          ) : null}
          {platform === 'manual' ? (
            <p className={styles.description}>
              {
                '브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택하세요.'
              }
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={dismiss}
            >
              나중에
            </button>
            {platform === 'installable' ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={promptInstall}
              >
                홈 화면에 추가
              </button>
            ) : (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={dismiss}
              >
                확인
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
