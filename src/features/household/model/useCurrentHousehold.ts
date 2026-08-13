'use client';

import { useCallback, useEffect, useState } from 'react';

import { CURRENT_HOUSEHOLD_STORAGE_KEY } from '../config/storageKeys';
import { useListHouseholds } from './useListHouseholds';

const readStoredHouseholdId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(CURRENT_HOUSEHOLD_STORAGE_KEY);
};

export const useCurrentHousehold = () => {
  const householdsQuery = useListHouseholds();
  const [householdId, setHouseholdIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHouseholdIdState(readStoredHouseholdId());
    setHydrated(true);
  }, []);

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
      setHouseholdIdState(resolvedId);
    }

    localStorage.setItem(CURRENT_HOUSEHOLD_STORAGE_KEY, resolvedId);
  }, [hydrated, householdId, resolvedId]);

  const setHouseholdId = useCallback((id: string) => {
    setHouseholdIdState(id);
    localStorage.setItem(CURRENT_HOUSEHOLD_STORAGE_KEY, id);
  }, []);

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
