import { redirectForAuthGate } from '@/features/onboarding/server';
import { getSafeNextPath } from '@/shared/lib';

export const authComplete = async (request: Request) => {
  const { searchParams, origin } = new URL(request.url);
  const next = getSafeNextPath(searchParams.get('next'));

  return redirectForAuthGate(origin, next);
};
