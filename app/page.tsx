import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { HomePage } from '@/pages/home';

const RootPage = async () => {
  const gate = await resolveAuthGate();

  if (gate.status !== 'ready') {
    redirect(gate.redirectTo);
  }

  return <HomePage />;
};

export default RootPage;
