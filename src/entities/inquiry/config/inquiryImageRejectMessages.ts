import { INQUIRY_MAX_IMAGES } from './limits';

/** 사진 추가가 거절된 사유별 안내. 사용자 화면과 어드민 화면이 함께 쓴다. */
export const INQUIRY_IMAGE_REJECT_MESSAGES = {
  count: `사진은 최대 ${INQUIRY_MAX_IMAGES}장까지 올릴 수 있어요.`,
  type: '지원하지 않는 사진 형식이에요. JPG, PNG, WebP, HEIC 사진만 올릴 수 있어요.',
  size: '사진은 장당 10MB까지 올릴 수 있어요.',
} as const;
