import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { CreateHouseholdPage } from '@/pages/createHousehold';

export const metadata: Metadata = {
  title: '가계부 만들기',
  robots: {
    index: false,
    follow: false,
  },
};

const CreateHouseholdRoutePage = async () => {
  const gate = await resolveAuthGate();

  if (gate.status === 'unauthenticated') {
    redirect('/login');
  }

  if (gate.status === 'needsProfile') {
    redirect('/onboarding/profile');
  }

  if (gate.status === 'ready') {
    redirect('/');
  }

  return <CreateHouseholdPage />;
};

export default CreateHouseholdRoutePage;
