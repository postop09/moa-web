import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { CreateProfilePage } from '@/pages/createProfile';
import { getSafeNextPath } from '@/shared/lib';

type Props = {
  searchParams: Promise<{ next?: string }>;
};

const CreateProfileRoutePage = async ({ searchParams }: Props) => {
  const { next } = await searchParams;
  const safeNext = getSafeNextPath(next);
  const gate = await resolveAuthGate();

  if (gate.status === 'unauthenticated') {
    redirect(
      safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : '/login',
    );
  }

  if (gate.status === 'needsHousehold') {
    redirect(safeNext ?? '/onboarding/household');
  }

  if (gate.status === 'ready') {
    redirect(safeNext ?? '/');
  }

  return <CreateProfilePage next={safeNext} />;
};

export default CreateProfileRoutePage;
