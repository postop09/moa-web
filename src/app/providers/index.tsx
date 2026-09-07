'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';

import { PwaInstallPrompt } from '@/features/pwaInstall';
import { getQueryClient } from '@/shared/lib';

type Props = {
  children: ReactNode;
};

export const Providers = ({ children }: Props) => {
  const queryClient = getQueryClient();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PwaInstallPrompt />
    </QueryClientProvider>
  );
};
