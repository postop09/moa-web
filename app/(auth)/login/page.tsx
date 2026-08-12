import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { LoginPage } from '@/pages/login';

const LoginRoutePage = async () => {
  const gate = await resolveAuthGate();

  if (gate.status !== 'unauthenticated') {
    redirect('/');
  }

  return <LoginPage />;
};

export default LoginRoutePage;
