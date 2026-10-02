import { INQUIRY_MAX_IMAGE_BYTES, INQUIRY_MAX_IMAGES } from '../config/limits';

type Result = { ok: true } | { ok: false; reason: 'count' | 'size' };

export const validateInquiryImages = (
  existingCount: number,
  files: { size: number }[],
): Result => {
  if (existingCount + files.length > INQUIRY_MAX_IMAGES) {
    return { ok: false, reason: 'count' };
  }
  if (files.some((f) => f.size > INQUIRY_MAX_IMAGE_BYTES)) {
    return { ok: false, reason: 'size' };
  }
  return { ok: true };
};
