import { describe, expect, it } from 'vitest';

import {
  INQUIRY_IMAGE_REJECT_MESSAGES,
  INQUIRY_MAX_IMAGES,
  isDefinitiveRejection,
  validateInquiryImages,
} from '@/entities/inquiry';

// 사용자 화면과 어드민 화면이 같은 문구를 쓴다. 문구가 한 글자라도 바뀌면 기존 화면 테스트가 깨진다.
describe('INQUIRY_IMAGE_REJECT_MESSAGES (공개 상수)', () => {
  it('count / type / size 세 사유의 문구를 갖는다', () => {
    expect(Object.keys(INQUIRY_IMAGE_REJECT_MESSAGES).sort()).toEqual([
      'count',
      'size',
      'type',
    ]);
  });

  it('기존 안내 문구와 한 글자도 다르지 않다', () => {
    expect(INQUIRY_IMAGE_REJECT_MESSAGES.count).toBe(
      '사진은 최대 3장까지 올릴 수 있어요.',
    );
    expect(INQUIRY_IMAGE_REJECT_MESSAGES.type).toBe(
      '지원하지 않는 사진 형식이에요. JPG, PNG, WebP, HEIC 사진만 올릴 수 있어요.',
    );
    expect(INQUIRY_IMAGE_REJECT_MESSAGES.size).toBe(
      '사진은 장당 10MB까지 올릴 수 있어요.',
    );
  });

  it('개수 문구는 INQUIRY_MAX_IMAGES 에서 만든다', () => {
    expect(INQUIRY_IMAGE_REJECT_MESSAGES.count).toBe(
      `사진은 최대 ${INQUIRY_MAX_IMAGES}장까지 올릴 수 있어요.`,
    );
  });

  it('validateInquiryImages 가 돌려주는 모든 사유에 문구가 있다', () => {
    const reasons = [
      validateInquiryImages(INQUIRY_MAX_IMAGES, [{ size: 1 }]),
      validateInquiryImages(0, [{ size: 1, type: 'image/gif' }]),
      validateInquiryImages(0, [{ size: Number.MAX_SAFE_INTEGER }]),
    ].map((result) => (result.ok ? null : result.reason));

    expect(reasons).toEqual(['count', 'type', 'size']);
    reasons.forEach((reason) => {
      expect(
        INQUIRY_IMAGE_REJECT_MESSAGES[reason as 'count' | 'type' | 'size'],
      ).not.toBe('');
    });
  });
});

describe('@/entities/inquiry 공개 API', () => {
  it('isDefinitiveRejection 을 내보낸다 (사용자·어드민 화면이 함께 쓴다)', () => {
    expect(typeof isDefinitiveRejection).toBe('function');
    expect(isDefinitiveRejection({ code: 'P0001', message: 'conflict' })).toBe(
      true,
    );
  });
});
