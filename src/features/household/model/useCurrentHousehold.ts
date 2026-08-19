'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { householdQueryKeys } from '../config/queryKeys';
import { CURRENT_HOUSEHOLD_STORAGE_KEY } from '../config/storageKeys';
import { useCurrentHouseholdStore } from './currentHouseholdStore';
import { useListHouseholds } from './useListHouseholds';

export const useCurrentHousehold = () => {
  const queryClient = useQueryClient();
  const householdsQuery = useListHouseholds();
  const householdId = useCurrentHouseholdStore((state) => state.householdId);
  const hydrated = useCurrentHouseholdStore((state) => state.hydrated);
  const hydrate = useCurrentHouseholdStore((state) => state.hydrate);
  const persistHouseholdId = useCurrentHouseholdStore(
    (state) => state.setHouseholdId,
  );

  useEffect(() => {
    if (hydrated) {
      return;
    }

    hydrate();
  }, [hydrate, hydrated]);

  const households = householdsQuery.data ?? [];

  const resolvedId = (() => {
    if (!hydrated || households.length === 0) {
      return null;
    }

    if (householdId && households.some((item) => item.id === householdId)) {
      return householdId;
    }

    return households[0]?.id ?? null;
  })();

  useEffect(() => {
    if (!hydrated || !resolvedId) {
      return;
    }

    if (householdId !== resolvedId) {
      persistHouseholdId(resolvedId);
      return;
    }

    localStorage.setItem(CURRENT_HOUSEHOLD_STORAGE_KEY, resolvedId);
  }, [hydrated, householdId, persistHouseholdId, resolvedId]);

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

  const household = households.find((item) => item.id === resolvedId) ?? null;

  return {
    households,
    household,
    householdId: resolvedId,
    setHouseholdId,
    isLoading: householdsQuery.isLoading || !hydrated,
    error: householdsQuery.error,
  };
};
