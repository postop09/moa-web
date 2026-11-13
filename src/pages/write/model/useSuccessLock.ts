'use client';

import { useRef, useState } from 'react';

/**
 * 비동기 동작이 성공한 뒤 화면 이동이 끝나기 전까지 중복 실행을 막는다.
 * 실패 시에는 잠그지 않으므로 재시도할 수 있다.
 *
 * - `isLocked`: 성공 후 true. 버튼 disabled 등 UI 잠금에 쓴다.
 * - `runOnce(action, onSuccess)`: 잠겨 있으면 아무것도 하지 않는다.
 *   `action`이 성공하면 잠근 뒤 `onSuccess`를 호출한다.
 *   `action` 실패는 삼킨다(에러는 mutation error state에 표시된다).
 */
export const useSuccessLock = () => {
  const hasSucceededRef = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  const runOnce = async (
    action: () => Promise<unknown>,
    onSuccess: () => void,
  ) => {
    if (hasSucceededRef.current) {
      return;
    }

    try {
      await action();
      hasSucceededRef.current = true;
      setIsLocked(true);
      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return { isLocked, runOnce };
};
