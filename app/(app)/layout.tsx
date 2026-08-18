import type { Metadata } from 'next';
import { type ReactNode, Suspense } from 'react';

import { AuthReadyGate } from '@/features/onboarding/server';
import { AppPageFallback, AppShell } from '@/widgets/appShell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  children: ReactNode;
};

const AppLayout = ({ children }: Props) => {
  return (
    <AppShell>
      <Suspense fallback={<AppPageFallback />}>
        <AuthReadyGate>{children}</AuthReadyGate>
      </Suspense>
    </AppShell>
  );
};

export default AppLayout;
