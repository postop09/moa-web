'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { resolveEffectiveHouseholdId } from './resolveEffectiveHouseholdId';
import { useCurrentHouseholdStore } from './currentHouseholdStore';
import { useListHouseholds } from './useListHouseholds';

export const useCurrentHousehold = () => {
  const queryClient = useQueryClient();
  const householdsQuery = useListHouseholds();
  const storedId = useCurrentHouseholdStore((state) => state.householdId);
  const hydrated = useCurrentHouseholdStore((state) => state.hydrated);
  const hydrate = useCurrentHouseholdStore((state) => state.hydrate);
  const persistHouseholdId = useCurrentHouseholdStore(
    (state) => state.setHouseholdId,
  );
  const clearHouseholdId = useCurrentHouseholdStore(
    (state) => state.clearHouseholdId,
  );

  useEffect(() => {
    if (hydrated) {
      return;
    }

    hydrate();
  }, [hydrate, hydrated]);

  const households = householdsQuery.data ?? [];
  const hasList = householdsQuery.isSuccess;

  const householdId = (() => {
    if (!hydrated) {
      return null;
    }

    if (hasList) {
      return resolveEffectiveHouseholdId(storedId, households);
    }

    return storedId;
  })();

  useEffect(() => {
    if (!hydrated || !hasList) {
      return;
    }

    const list = householdsQuery.data ?? [];

    if (list.length === 0) {
      if (storedId) {
        clearHouseholdId();
      }
      return;
    }

    const nextId = resolveEffectiveHouseholdId(storedId, list);

    if (!nextId || storedId === nextId) {
      return;
    }

    persistHouseholdId(nextId);
  }, [
    clearHouseholdId,
    hasList,
    householdsQuery.data,
    hydrated,
    persistHouseholdId,
    storedId,
  ]);

  const setHouseholdId = useCallback(
    (id: string) => {
      persistHouseholdId(id);

      // household feature는 FSD 규칙상 다른 feature(transaction, schedule,
      // householdInvite 등)의 queryKey 팩토리를 직접 import할 수 없다(동일 레이어
      // 참조 금지). 그래서 queryKey 구조를 '두 번째 요소가 list/invites이고
      // 세 번째 요소가 householdId'라는 암묵적 규약으로 취급해 predicate로 판별한다.
      // householdQueryKeys.list()(['households', 'list'])는 세 번째 요소가 없어
      // keyHouseholdId가 항상 undefined이므로 이 predicate 자체로 이미 제외된다.
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const [, marker, keyHouseholdId] = query.queryKey;

          return (
            (marker === 'list' || marker === 'invites') && keyHouseholdId === id
          );
        },
      });
    },
    [persistHouseholdId, queryClient],
  );

  const household = households.find((item) => item.id === householdId) ?? null;

  return {
    households,
    household,
    householdId,
    setHouseholdId,
    isLoading: !householdId && (!hydrated || householdsQuery.isLoading),
    isHouseholdsLoading: !hydrated || householdsQuery.isLoading,
    isHouseholdsSuccess: hasList,
    error: householdsQuery.error,
  };
};
