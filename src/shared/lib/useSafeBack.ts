'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { getHasInAppHistory } from './navigationHistory';

/**
 * 앱 내 이전 화면이 있으면 router.back(), 직접 진입(링크 공유 등)이면
 * fallbackHref 로 replace 한다. 기록은 호출 시점에 읽는다.
 */
export const useSafeBack = (fallbackHref: string) => {
  const router = useRouter();

  return useCallback(() => {
    if (getHasInAppHistory()) {
      router.back();

      return;
    }
    router.replace(fallbackHref);
  }, [router, fallbackHref]);
};
