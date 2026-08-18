'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';

const PENDING_TIMEOUT_MS = 8000;

const isModifiedClick = (event: MouseEvent<HTMLAnchorElement>) => {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
};

export const usePendingHref = () => {
  const pathname = usePathname() ?? '';
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const activePendingHref =
    pendingHref && pendingHref !== pathname ? pendingHref : null;

  useEffect(() => {
    if (!activePendingHref) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingHref(null);
    }, PENDING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activePendingHref]);

  const onPendingClick = (href: string) => {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      if (isModifiedClick(event) || href === pathname) {
        return;
      }

      setPendingHref(href);
    };
  };

  return {
    pathname,
    pendingHref: activePendingHref,
    onPendingClick,
  };
};
