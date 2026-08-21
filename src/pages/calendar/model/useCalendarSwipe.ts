'use client';

import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

const AXIS_LOCK_PX = 30;
const TRIGGER_PX = 50;

type Props = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
};

type Axis = 'x' | 'y';

export const useCalendarSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: Props) => {
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const axisRef = useRef<Axis | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  const reset = () => {
    originRef.current = null;
    axisRef.current = null;
    pointerIdRef.current = null;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    didSwipeRef.current = false;
    originRef.current = { x: event.clientX, y: event.clientY };
    axisRef.current = null;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!originRef.current || pointerIdRef.current !== event.pointerId) {
      return;
    }

    const dx = event.clientX - originRef.current.x;
    const dy = event.clientY - originRef.current.y;

    if (!axisRef.current) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) {
        return;
      }

      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!originRef.current || pointerIdRef.current !== event.pointerId) {
      return;
    }

    const dx = event.clientX - originRef.current.x;
    const dy = event.clientY - originRef.current.y;
    const axis = axisRef.current;
    reset();

    if (axis === 'x' && Math.abs(dx) >= TRIGGER_PX) {
      didSwipeRef.current = true;
      if (dx < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
      return;
    }

    if (axis === 'y' && Math.abs(dy) >= TRIGGER_PX) {
      didSwipeRef.current = true;
      if (dy < 0) {
        onSwipeUp();
      } else {
        onSwipeDown();
      }
    }
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    reset();
  };

  const hasSwiped = () => didSwipeRef.current;

  return {
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    hasSwiped,
  };
};
