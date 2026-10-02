const AUTH_PATTERN = /forbidden|unauthorized/i;

/** 권한 없음·로그인 만료로 보이는 오류인지(code 또는 message 에 forbidden/unauthorized). */
export const isAuthError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;

  const { code, message } = error as { code?: unknown; message?: unknown };

  return [code, message].some(
    (value) => typeof value === 'string' && AUTH_PATTERN.test(value),
  );
};
