import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { AcceptInvitePage } from '@/pages/acceptInvite';
import { getSafeNextPath } from '@/shared/lib';

type Props = {
  params: Promise<{ token: string }>;
};

const InviteRoutePage = async ({ params }: Props) => {
  const { token } = await params;
  const next = getSafeNextPath(`/invite/${token}`);

  if (!next) {
    redirect('/');
  }

  const gate = await resolveAuthGate();

  if (gate.status === 'unauthenticated') {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (gate.status === 'needsProfile') {
    redirect(`/onboarding/profile?next=${encodeURIComponent(next)}`);
  }

  return <AcceptInvitePage token={token} />;
};

export default InviteRoutePage;
