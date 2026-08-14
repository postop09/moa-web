const INVITE_PATH_PATTERN =
  /^\/invite\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getSafeNextPath = (next: string | null | undefined) => {
  if (!next) {
    return null;
  }

  if (next.includes('://') || next.includes('\\') || next.startsWith('//')) {
    return null;
  }

  if (!INVITE_PATH_PATTERN.test(next)) {
    return null;
  }

  return next;
};
