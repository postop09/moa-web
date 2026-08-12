import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { CreateProfilePage } from '@/pages/createProfile';

const CreateProfileRoutePage = async () => {
  const gate = await resolveAuthGate();

  if (gate.status === 'unauthenticated') {
    redirect('/login');
  }

  if (gate.status === 'needsHousehold') {
    redirect('/onboarding/household');
  }

  if (gate.status === 'ready') {
    redirect('/');
  }

  return <CreateProfilePage />;
};

export default CreateProfileRoutePage;
