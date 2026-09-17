'use client';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { type ReactNode, useEffect, useMemo } from 'react';

import { PwaInstallPrompt } from '@/features/pwaInstall';
import {
  QUERY_PERSIST_BUSTER,
  QUERY_PERSIST_MAX_AGE_MS,
} from '@/shared/config';
import { getQueryClient, getQueryPersister } from '@/shared/lib';

import { shouldDehydrateQuery } from './shouldDehydrateQuery';

type Props = {
  children: ReactNode;
};

export const Providers = ({ children }: Props) => {
  const queryClient = getQueryClient();
  // 매 렌더마다 새 객체를 넘기면 PersistQueryClientProvider가 복원·구독을 다시 시작한다.
  const persistOptions = useMemo(
    () => ({
      persister: getQueryPersister(),
      maxAge: QUERY_PERSIST_MAX_AGE_MS,
      buster: QUERY_PERSIST_BUSTER,
      dehydrateOptions: { shouldDehydrateQuery },
    }),
    [],
  );

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      {children}
      <PwaInstallPrompt />
    </PersistQueryClientProvider>
  );
};
