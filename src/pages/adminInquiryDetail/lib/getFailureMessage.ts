import { getAdminErrorKind } from '@/entities/admin';

import {
  CONFLICT_TEXT,
  INVALID_STATE_TEXT,
  NETWORK_TEXT,
  PERMISSION_TEXT,
  SUBMIT_FAILURE_TEXT,
  UNCATEGORIZED_TEXT,
  UPLOAD_FAILURE_TEXT,
} from '../config/texts';

import { isPhotoUploadError } from './photoUploadError';

/** 서버 오류 원문은 노출하지 않고 종류별 고정 문구만 돌려준다. */
export const getFailureMessage = (error: unknown, fallback: string) => {
  switch (getAdminErrorKind(error)) {
    case 'forbidden':
      return PERMISSION_TEXT;
    case 'network':
      return NETWORK_TEXT;
    case 'invalid_state':
      return INVALID_STATE_TEXT;
    default:
      return fallback;
  }
};

export type ReplyFailure = {
  message: string;
  /** 다른 운영자가 먼저 답변했다. 새로고침을 안내한다. */
  isConflict: boolean;
};

export const getReplyFailure = (error: unknown): ReplyFailure => {
  if (isPhotoUploadError(error)) {
    return { message: UPLOAD_FAILURE_TEXT, isConflict: false };
  }

  const kind = getAdminErrorKind(error);

  if (kind === 'conflict') return { message: CONFLICT_TEXT, isConflict: true };
  if (kind === 'uncategorized') {
    return { message: UNCATEGORIZED_TEXT, isConflict: false };
  }

  return {
    message: getFailureMessage(error, SUBMIT_FAILURE_TEXT),
    isConflict: false,
  };
};
