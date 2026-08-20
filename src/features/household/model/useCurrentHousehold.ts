'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { householdQueryKeys } from '../config/queryKeys';
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
      if (households.length === 0) {
        return null;
      }

      if (storedId && households.some((item) => item.id === storedId)) {
        return storedId;
      }

      return households[0]?.id ?? null;
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

    const nextId =
      storedId && list.some((item) => item.id === storedId)
        ? storedId
        : (list[0]?.id ?? null);

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

      const listKey = householdQueryKeys.list();

      void queryClient.invalidateQueries({
        predicate: (query) => {
          if (
            query.queryKey.length === listKey.length &&
            query.queryKey[0] === listKey[0] &&
            query.queryKey[1] === listKey[1]
          ) {
            return false;
          }

          return query.queryKey.includes(id);
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
