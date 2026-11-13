'use client';

import { useEffect, useRef } from 'react';

type Options = {
  enabled: boolean;
};

const isNothingFocused = () => {
  const { activeElement } = document;
  return activeElement === null || activeElement === document.body;
};

/**
 * `enabled`가 처음 true가 되는 시점에 한 번만 요소에 포커스한다.
 * 그 시점에 사용자가 이미 다른 요소로 이동했다면 포커스를 가져오지 않으며,
 * 이 경우도 1회 처리 완료로 보고 이후 재활성화에도 포커스하지 않는다.
 */
export const useAutoFocusOnEnable = <T extends HTMLElement>({
  enabled,
}: Options) => {
  const ref = useRef<T>(null);
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasHandledRef.current) {
      return;
    }

    hasHandledRef.current = true;

    if (isNothingFocused()) {
      ref.current?.focus();
    }
  }, [enabled]);

  return ref;
};
