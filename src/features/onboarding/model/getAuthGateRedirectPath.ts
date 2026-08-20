import type { AuthGateResult } from './resolveAuthGate';

export const getAuthGateRedirectPath = (
  gate: AuthGateResult,
  next: string | null,
) => {
  if (gate.status === 'unauthenticated') {
    return next ? `/login?next=${encodeURIComponent(next)}` : '/login';
  }

  if (gate.status === 'ready') {
    return next ?? '/';
  }

  if (gate.status === 'needsProfile') {
    return next
      ? `/onboarding/profile?next=${encodeURIComponent(next)}`
      : '/onboarding/profile';
  }

  if (next?.startsWith('/invite/')) {
    return next;
  }

  return '/onboarding/household';
};
