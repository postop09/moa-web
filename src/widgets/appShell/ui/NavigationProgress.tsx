'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import styles from './appShell.module.css';

const HIDE_TIMEOUT_MS = 8000;

const getInternalPathname = (anchor: HTMLAnchorElement) => {
  if (anchor.target && anchor.target !== '_self') {
    return null;
  }

  if (anchor.hasAttribute('download')) {
    return null;
  }

  const url = new URL(anchor.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return null;
  }

  return url.pathname;
};

export const NavigationProgress = () => {
  const pathname = usePathname() ?? '';
  const [pendingPathname, setPendingPathname] = useState<string | null>(null);
  const isPending = Boolean(pendingPathname && pendingPathname !== pathname);

  useEffect(() => {
    if (!isPending) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingPathname(null);
    }, HIDE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPending]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const nextPathname = getInternalPathname(anchor);
      if (!nextPathname || nextPathname === window.location.pathname) {
        return;
      }

      setPendingPathname(nextPathname);
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return (
    <div
      className={`${styles.progress} ${isPending ? styles.progressActive : ''}`}
      aria-hidden={!isPending}
    >
      <div className={styles.progressBar} />
    </div>
  );
};
