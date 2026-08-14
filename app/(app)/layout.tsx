import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';

import { resolveAuthGate } from '@/features/onboarding/server';
import { AppShell } from '@/widgets/appShell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

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
