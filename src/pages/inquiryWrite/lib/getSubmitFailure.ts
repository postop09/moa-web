import { getErrorCode, getErrorMessage } from '@/shared/lib';

import { isPhotoUploadError } from './photoUploadError';

export const AUTH_REQUIRED_MESSAGE = '로그인이 필요합니다.';
export const EDIT_LOCKED_MESSAGE = '답변이 시작된 문의는 수정할 수 없어요.';

const FAILURE_MESSAGES = {
  auth: '로그인이 만료됐어요. 다시 로그인해주세요.',
  network: '연결을 확인하고 다시 시도해주세요.',
  upload: '사진 업로드에 실패했어요. 다시 시도해주세요.',
  locked: EDIT_LOCKED_MESSAGE,
  default: '등록하지 못했어요. 다시 시도해주세요.',
} as const;

export type SubmitFailureKind = keyof typeof FAILURE_MESSAGES;

const NETWORK_MESSAGE_PATTERN = /failed to fetch|load failed|networkerror/i;

const isNetworkError = (error: unknown) =>
  error instanceof TypeError ||
  NETWORK_MESSAGE_PATTERN.test(getErrorMessage(error, ''));

const isInvalidState = (error: unknown) =>
  getErrorCode(error) === 'invalid_state' ||
  getErrorMessage(error, '').includes('invalid_state');

const getKind = (error: unknown): SubmitFailureKind => {
  if (isPhotoUploadError(error)) return 'upload';
  if (isInvalidState(error)) return 'locked';
  if (
    getErrorCode(error) === 'unauthorized' ||
    getErrorMessage(error, '') === AUTH_REQUIRED_MESSAGE
  ) {
    return 'auth';
  }
  if (isNetworkError(error)) return 'network';

  return 'default';
};

/** 제출 오류를 사용자에게 보여줄 안내 문구로 분류한다. */
export const getSubmitFailure = (error: unknown) => {
  const kind = getKind(error);

  return { kind, message: FAILURE_MESSAGES[kind] };
};
