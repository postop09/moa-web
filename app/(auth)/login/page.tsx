import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { LoginPage } from '@/pages/login';
import { getSafeNextPath } from '@/shared/lib';

type Props = {
  searchParams: Promise<{ next?: string }>;
};

const LoginRoutePage = async ({ searchParams }: Props) => {
  const { next } = await searchParams;
  const safeNext = getSafeNextPath(next);
  const gate = await resolveAuthGate();

  if (gate.status !== 'unauthenticated') {
    redirect(safeNext ?? '/');
  }

  return <LoginPage next={safeNext} />;
};

export default LoginRoutePage;
