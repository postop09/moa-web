import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBeforeUnloadGuard } from './useBeforeUnloadGuard';

// pages/inquiryWrite/model 에서 shared/lib 로 올린 훅. 동작은 그대로다.
const fireBeforeUnload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);

  return event;
};

describe('useBeforeUnloadGuard', () => {
  it('enabled 가 false 면 이탈을 막지 않는다', () => {
    renderHook(() => useBeforeUnloadGuard(false));

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('enabled 가 true 면 beforeunload 를 막는다', () => {
    renderHook(() => useBeforeUnloadGuard(true));

    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('enabled 가 바뀌면 그에 맞춰 켜고 끈다', () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useBeforeUnloadGuard(enabled),
      { initialProps: { enabled: true } },
    );

    rerender({ enabled: false });

    expect(fireBeforeUnload().defaultPrevented).toBe(false);

    rerender({ enabled: true });

    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('언마운트하면 리스너를 제거한다', () => {
    const { unmount } = renderHook(() => useBeforeUnloadGuard(true));

    unmount();

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});
