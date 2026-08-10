'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { getQueryClient } from '@/shared/lib';

type Props = {
  children: ReactNode;
};

export const Providers = ({ children }: Props) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
