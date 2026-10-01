'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import {
  clearInAppNavigation,
  getHistoryLengthBaseline,
  markInAppNavigation,
  setHistoryLengthBaseline,
} from './navigationHistory';

// 문서(모듈 인스턴스)당 한 번만 초기화한다. useRef 면 같은 문서에서 재마운트될 때
// 기록을 다시 지워버리므로 모듈 레벨로 둔다.
let initialised = false;

// 같은 탭의 이전 문서에서 남은 sessionStorage 플래그 때문에, 새로 연 화면
// (예: /support/inquiries/new)이 이전 화면이 없는데도 router.back() 을 호출하면 안 된다.
// 새 탐색('navigate')으로 열린 문서면 플래그를 지우고 기준 길이를 새로 잡는다.
// reload/back_forward 등 그 외에는 저장된 값을 그대로 둔다.
const initialiseHistory = () => {
  if (initialised) return;
  initialised = true;

  try {
    const entry = performance.getEntriesByType('navigation')[0] as
      { type?: string } | undefined;

    if (entry?.type === 'navigate') {
      clearInAppNavigation();
      setHistoryLengthBaseline(window.history.length);
    }
  } catch {
    // API 미지원/예외 시 저장된 값을 유지한다.
  }
};

/**
 * 앱 셸에 한 번 마운트한다. 경로가 바뀔 때 window.history.length 가 늘었다면
 * (= push 이동) "앱 내 이전 화면 있음"을 기록한다. replace 는 길이가 그대로라 무시한다.
 *
 * 한계: 브라우저는 history.length 를 최대 50 에서 멈춘다. 항목이 가득 찬 뒤의
 * push 는 길이가 늘지 않아 감지하지 못한다. 이미 플래그가 켜져 있으면 유지되고,
 * 켜지기 전에 한도에 닿은 드문 경우에만 fallback 경로로 돌아간다.
 */
export const InAppNavigationTracker = () => {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    initialiseHistory();
    const length = window.history.length;

    if (previous.current !== null && previous.current !== pathname) {
      const baseline = getHistoryLengthBaseline();

      if (baseline !== null && length > baseline) markInAppNavigation();
    }
    setHistoryLengthBaseline(length);
    previous.current = pathname;
  }, [pathname]);

  return null;
};
