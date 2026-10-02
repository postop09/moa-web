const REJECTION_MESSAGE_PATTERN =
  /^(invalid_|forbidden|not_found|unauthorized|conflict|uncategorized|already_rated)/;

const readField = (error: unknown, key: 'code' | 'message') => {
  if (typeof error !== 'object' || error === null) return null;

  const value = (error as Record<string, unknown>)[key];

  return typeof value === 'string' ? value : null;
};

/**
 * 서버가 요청을 확정적으로 거절했는지. 거절이면 DB 에 아무것도 남지 않았으므로
 * 올려 둔 첨부를 정리해도 안전하다.
 * supabase-js 는 fetch 실패도 code 가 빈 문자열인 객체로 돌려주므로, 비어 있지 않은 문자열 code 이거나
 * 메시지가 RPC 토큰으로 시작할 때만 확정 거절로 본다. 네트워크/알 수 없는 오류는 서버가
 * 이미 처리했을 수 있어 false 로 두고 파일을 지키지 않는다.
 */
export const isDefinitiveRejection = (error: unknown): boolean => {
  const code = readField(error, 'code');

  if (code !== null && code !== '') return true;

  return REJECTION_MESSAGE_PATTERN.test(readField(error, 'message') ?? '');
};
