export type AdminErrorKind =
  | 'conflict'
  | 'forbidden'
  | 'uncategorized'
  | 'invalid_state'
  | 'not_found'
  | 'invalid_body'
  | 'invalid_attachments'
  | 'network'
  | 'unknown';

// RPC 의 RAISE EXCEPTION 코드. 메시지에 이 토큰이 들어 있는지 대소문자 구분해 찾는다.
const CODE_TOKENS: [string, AdminErrorKind][] = [
  ['conflict', 'conflict'],
  ['forbidden', 'forbidden'],
  ['unauthorized', 'forbidden'],
  ['uncategorized', 'uncategorized'],
  ['invalid_state', 'invalid_state'],
  ['not_found', 'not_found'],
  ['invalid_body', 'invalid_body'],
  ['invalid_attachments', 'invalid_attachments'],
];

const NETWORK_PATTERN = /failed to fetch|load failed|networkerror/i;

const readMessage = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null) return null;

  const { message } = error as { message?: unknown };

  return typeof message === 'string' ? message : null;
};

/** 어드민 RPC·Storage 오류를 화면에서 문구를 고를 수 있는 종류로 나눈다. */
export const getAdminErrorKind = (error: unknown): AdminErrorKind => {
  const message = readMessage(error);

  if (message === null) return 'unknown';

  const matched = CODE_TOKENS.find(([token]) => message.includes(token));

  if (matched) return matched[1];

  return NETWORK_PATTERN.test(message) ? 'network' : 'unknown';
};
