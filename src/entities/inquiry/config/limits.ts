export const INQUIRY_TITLE_MIN = 2;
export const INQUIRY_TITLE_MAX = 50;
export const INQUIRY_BODY_MIN = 10;
export const INQUIRY_BODY_MAX = 2000;
export const INQUIRY_MAX_IMAGES = 3;
export const INQUIRY_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const INQUIRY_PAGE_SIZE = 20;
export const INQUIRY_OVERDUE_HOURS = 24;
export const INQUIRY_CLASSIFY_THRESHOLD = 0.5;
export const INQUIRY_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;
