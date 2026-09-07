// Supabase의 PostgrestError 등은 message 필드를 갖고 있지만 Error 인스턴스는 아니라서,
// error instanceof Error만 검사하면 전부 fallback 문구로 떨어진다.
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
};
