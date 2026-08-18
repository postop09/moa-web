export const AUTH_GATE_COOKIE_NAME = 'moa_gate';

export const AUTH_GATE_READY_PREFIX = 'ready:';

export const toAuthGateReadyValue = (userId: string) => {
  return `${AUTH_GATE_READY_PREFIX}${userId}`;
};

export const getAuthGateReadyUserId = (value: string | undefined) => {
  if (!value?.startsWith(AUTH_GATE_READY_PREFIX)) {
    return null;
  }

  const userId = value.slice(AUTH_GATE_READY_PREFIX.length);

  return userId || null;
};
