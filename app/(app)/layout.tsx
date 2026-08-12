import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { AppShell } from '@/widgets/appShell';

type Props = {
  children: ReactNode;
};

const AppLayout = async ({ children }: Props) => {
  const gate = await resolveAuthGate();

  if (gate.status !== 'ready') {
    redirect(gate.redirectTo);
  }

  return <AppShell>{children}</AppShell>;
};

export default AppLayout;
