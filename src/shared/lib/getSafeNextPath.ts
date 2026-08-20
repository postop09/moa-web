const INVITE_PATH_PATTERN =
  /^\/invite\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const APP_PATH_PATTERN =
  /^\/(?:history|stats|calendar|settings|write(?:\/\d+)?)?$/;

export const getSafeNextPath = (next: string | null | undefined) => {
  if (!next) {
    return null;
  }

  if (
    next.includes('://') ||
    next.includes('\\') ||
    next.startsWith('//') ||
    next.includes('?') ||
    next.includes('#')
  ) {
    return null;
  }

  if (APP_PATH_PATTERN.test(next) || INVITE_PATH_PATTERN.test(next)) {
    return next;
  }

  return null;
};

export const getAuthCompletePath = (next?: string | null) => {
  if (!next) {
    return '/auth/complete';
  }

  return `/auth/complete?next=${encodeURIComponent(next)}`;
};
