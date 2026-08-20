import type { NextResponse } from 'next/server';

import {
  AUTH_GATE_COOKIE_NAME,
  AUTH_GATE_COOKIE_OPTIONS,
  toAuthGateReadyValue,
} from '@/shared/config';

import type { AuthGateResult } from './resolveAuthGate';

export const applyAuthGateCookie = (
  response: NextResponse,
  gate: AuthGateResult,
) => {
  if (gate.status === 'ready') {
    response.cookies.set(
      AUTH_GATE_COOKIE_NAME,
      toAuthGateReadyValue(gate.userId),
      AUTH_GATE_COOKIE_OPTIONS,
    );
    return;
  }

  response.cookies.delete({
    name: AUTH_GATE_COOKIE_NAME,
    path: '/',
  });
};
