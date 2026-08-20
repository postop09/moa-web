'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useCurrentHousehold } from '@/features/household';
import { redirectIfNoHouseholds } from '@/features/onboarding';

export const NoHouseholdRedirect = () => {
  const router = useRouter();
  const { households, isHouseholdsSuccess } = useCurrentHousehold();

  useEffect(() => {
    if (!isHouseholdsSuccess) {
      return;
    }

    void redirectIfNoHouseholds(households, router);
  }, [households, isHouseholdsSuccess, router]);

  return null;
};
