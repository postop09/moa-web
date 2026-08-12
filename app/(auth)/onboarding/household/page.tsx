import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { CreateHouseholdPage } from '@/pages/createHousehold';

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
