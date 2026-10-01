'use client';

import { useEffect, useRef } from 'react';

/**
 * 다이얼로그가 닫히면 getTarget 의 요소로 포커스를 돌려준다. Modal 은 열릴 때의 activeElement 로
 * 되돌리지만, 클릭해도 버튼에 포커스가 가지 않는 브라우저(Safari)에서는 body 가 되므로 직접 보장한다.
 */
export const useRestoreFocus = (
  isOpen: boolean,
  getTarget: () => HTMLElement | null | undefined,
) => {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) getTarget()?.focus();
    wasOpenRef.current = isOpen;
  });
};
