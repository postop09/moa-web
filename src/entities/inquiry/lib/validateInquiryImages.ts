import {
  INQUIRY_IMAGE_TYPES,
  INQUIRY_MAX_IMAGE_BYTES,
  INQUIRY_MAX_IMAGES,
} from '../config/limits';
import { getImageMimeByName } from './inquiryImageMime';

type Result = { ok: true } | { ok: false; reason: 'count' | 'type' | 'size' };

const ALLOWED_TYPES: readonly string[] = INQUIRY_IMAGE_TYPES;

const isAllowedType = (f: { type?: string; name?: string }) => {
  if (f.type === undefined) return true;
  if (f.type === '') return getImageMimeByName(f.name) !== null;

  return ALLOWED_TYPES.includes(f.type);
};

/** 우선순위: count > type > size. type 이 없는(undefined) 입력은 형식 검사를
 * 건너뛰고, 빈 문자열('' — 일부 브라우저의 HEIC)이면 확장자로 판단한다. */
export const validateInquiryImages = (
  existingCount: number,
  files: { size: number; type?: string; name?: string }[],
): Result => {
  if (existingCount + files.length > INQUIRY_MAX_IMAGES) {
    return { ok: false, reason: 'count' };
  }
  if (files.some((f) => !isAllowedType(f))) {
    return { ok: false, reason: 'type' };
  }
  if (files.some((f) => f.size > INQUIRY_MAX_IMAGE_BYTES)) {
    return { ok: false, reason: 'size' };
  }
  return { ok: true };
};
