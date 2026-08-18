import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';

import { resolveAppAuthGate } from '../model/resolveAuthGate';
import { AuthGateCookieSync } from './AuthGateCookieSync';

type Props = {
  children: ReactNode;
};

export const AuthReadyGate = async ({ children }: Props) => {
  const { gate, shouldPersistReadyCookie } = await resolveAppAuthGate();

  if (gate.status !== 'ready') {
    redirect(gate.redirectTo);
  }

  return (
    <>
      {shouldPersistReadyCookie ? <AuthGateCookieSync /> : null}
      {children}
    </>
  );
};
