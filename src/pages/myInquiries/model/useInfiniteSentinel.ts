'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * 센티널이 화면에 들어오면 onIntersect 를 부른다. IntersectionObserver 가 없는
 * 환경에서는 isSupported 가 false 라 호출부가 '더 보기' 버튼으로 대신해야 한다.
 */
export const useInfiniteSentinel = (
  onIntersect: () => void,
  enabled: boolean,
) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onIntersectRef = useRef(onIntersect);
  // 서버 렌더에서는 지원한다고 보고 버튼을 그리지 않는다. 하이드레이션 뒤 실제 값으로 바뀐다.
  const isSupported = useSyncExternalStore(
    subscribe,
    () => typeof IntersectionObserver !== 'undefined',
    () => true,
  );

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!enabled || !isSupported || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onIntersectRef.current();
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [enabled, isSupported]);

  return { sentinelRef, isSupported };
};
