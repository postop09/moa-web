'use client';

import { useEffect } from 'react';

/** enabled 인 동안 탭 닫기·새로고침 시 브라우저 확인을 띄운다. */
export const useBeforeUnloadGuard = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // 일부 브라우저는 returnValue 가 있어야 확인창을 띄운다.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);
};
