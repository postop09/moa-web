'use client';

import { useEffect, useEffectEvent } from 'react';

export const useScrollFrame = (onFrame: () => void) => {
  const onFrameEvent = useEffectEvent(onFrame);

  useEffect(() => {
    let frameId = 0;

    const run = () => {
      frameId = 0;
      onFrameEvent();
    };

    const schedule = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(run);
    };

    run();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);

      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);
};
