'use client';

import { useEffect, useRef, useState } from 'react';

export const useCountUp = (target: number, durationMs = 450) => {
  const [value, setValue] = useState(target);
  const displayedRef = useRef(target);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const duration = reduceMotion ? 0 : durationMs;

    let frameId = 0;
    const start = performance.now();
    const from = displayedRef.current;

    const tick = (now: number) => {
      const progress =
        duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (target - from) * eased);
      displayedRef.current = next;
      setValue(next);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [durationMs, target]);

  return value;
};
