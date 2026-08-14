const MESSAGE_MAP: Record<string, string> = {
  'not authenticated': '로그인이 필요합니다.',
  'invite not found': '초대를 찾을 수 없습니다.',
  'invite is not pending': '이미 처리된 초대입니다.',
  'profile not found': '프로필이 필요합니다.',
  'invite email mismatch': '초대받은 이메일과 로그인 계정이 다릅니다.',
  'already a member': '이미 이 가계부의 멤버입니다.',
};

const matchMappedMessage = (message: string) => {
  const entry = Object.entries(MESSAGE_MAP).find(([key]) =>
    message.includes(key),
  );

  return entry?.[1] ?? null;
};

export const mapInviteError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return new Error('초대 처리에 실패했습니다.');
  }

  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';

  if (code === '23505') {
    return new Error('이미 초대한 이메일입니다.');
  }

  const mapped = matchMappedMessage(message);

  if (mapped) {
    return new Error(mapped);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(message || '초대 처리에 실패했습니다.');
};
