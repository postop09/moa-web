'use client';

import { create } from 'zustand';

import { CURRENT_HOUSEHOLD_STORAGE_KEY } from '../config/storageKeys';

const readStoredHouseholdId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(CURRENT_HOUSEHOLD_STORAGE_KEY);
};

type CurrentHouseholdState = {
  householdId: string | null;
  hydrated: boolean;
  hydrate: () => void;
  setHouseholdId: (id: string) => void;
};

type CurrentHouseholdActions = {
  hydrate: () => void;
  setHouseholdId: (id: string) => void;
};

type CurrentHouseholdStore = CurrentHouseholdState & CurrentHouseholdActions;

export const useCurrentHouseholdStore = create<CurrentHouseholdStore>(
  (set) => ({
    householdId: null,
    hydrated: false,
    hydrate: () => {
      set({
        householdId: readStoredHouseholdId(),
        hydrated: true,
      });
    },
    setHouseholdId: (id) => {
      localStorage.setItem(CURRENT_HOUSEHOLD_STORAGE_KEY, id);
      set({ householdId: id });
    },
  }),
);
