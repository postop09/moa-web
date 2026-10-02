'use client';

import { useState } from 'react';

/**
 * 서버 값을 보여 주되, 변경 요청 중에는 고른 값을 먼저 보여 준다(실패하면 서버 값으로 되돌린다).
 * 성공 뒤 서버가 다시 조회되어 updatedAt 이 바뀌면 덮어쓴 값은 저절로 효력을 잃는다.
 */
export const useServerValue = <T>(serverValue: T, updatedAt: string) => {
  const [override, setOverride] = useState<{ value: T; at: string } | null>(
    null,
  );
  const value =
    override && override.at === updatedAt ? override.value : serverValue;

  return {
    value,
    set: (next: T) => setOverride({ value: next, at: updatedAt }),
    reset: () => setOverride(null),
  };
};
