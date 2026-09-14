// Supabase의 PostgrestError 등은 code 필드를 갖고 있지만 Error 인스턴스는 아닐 수 있어서,
// 'code' in error 형태의 duck-typing으로 안전하게 추출한다.
export const getErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const { code } = error as { code: unknown };

  if (code === undefined || code === null) {
    return null;
  }

  return String(code);
};
