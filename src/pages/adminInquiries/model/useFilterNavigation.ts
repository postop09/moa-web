'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import {
  parseAdminInquiryFilters,
  serializeAdminInquiryFilters,
} from '@/entities/admin';
import type { AdminInquiryFilters } from '@/entities/admin';

import { ADMIN_INQUIRIES_PATH } from '../config/filterOptions';

type Patch = Partial<AdminInquiryFilters>;
/** 가장 최근에 보낸 필터를 받아 바꿀 값을 돌려준다. null 이면 아무것도 하지 않는다. */
export type FilterUpdater = (latest: AdminInquiryFilters) => Patch | null;

/**
 * 필터의 단일 출처는 URL 이다. 바꾸면 router.replace 로 쿼리만 갈아끼운다(히스토리를 쌓지 않는다).
 * 다만 filters prop 은 서버 왕복 뒤에야 갱신되므로, 그 사이의 연속 변경이 서로 덮어쓰지 않게
 * "가장 최근에 보낸 필터"를 ref 에 누적한다. prop 이 내가 보낸 값(의 하나)으로 돌아오면 누적값을
 * 유지하고, 그 밖의 값이 오면(초기화·뒤로 가기 등) prop 으로 다시 맞춘다.
 */
export const useFilterNavigation = (filters: AdminInquiryFilters) => {
  const router = useRouter();
  const propRef = useRef(filters);
  const latest = useRef(filters);
  // 보냈지만 아직 prop 으로 돌아오지 않은 쿼리 문자열(보낸 순서).
  const pending = useRef<string[]>([]);
  const key = serializeAdminInquiryFilters(filters);

  useEffect(() => {
    propRef.current = filters;
  });

  useEffect(() => {
    const index = pending.current.indexOf(key);

    if (index >= 0) {
      pending.current.splice(0, index + 1);

      if (pending.current.length > 0) return;
    } else {
      pending.current = [];
    }

    latest.current = propRef.current;
  }, [key]);

  const remember = useCallback((next: AdminInquiryFilters) => {
    const query = serializeAdminInquiryFilters(next);
    const last =
      pending.current[pending.current.length - 1] ??
      serializeAdminInquiryFilters(latest.current);

    latest.current = next;
    if (query !== last) pending.current.push(query);

    return query;
  }, []);

  const replaceWith = useCallback(
    (next: AdminInquiryFilters) => {
      const query = remember(next);

      router.replace(
        query ? `${ADMIN_INQUIRIES_PATH}?${query}` : ADMIN_INQUIRIES_PATH,
        { scroll: false },
      );
    },
    [remember, router],
  );

  /** 필터를 바꾸면 결과 범위가 달라지므로 page 는 1 로 돌아간다(patch 가 page 를 주면 그 값). */
  const apply = useCallback(
    (change: Patch | FilterUpdater) => {
      const patch =
        typeof change === 'function' ? change(latest.current) : change;

      if (!patch) return;

      replaceWith({ ...latest.current, page: 1, ...patch });
    },
    [replaceWith],
  );

  const reset = useCallback(() => {
    remember(parseAdminInquiryFilters({}));
    router.replace(ADMIN_INQUIRIES_PATH);
  }, [remember, router]);

  return { apply, reset, replaceWith };
};
