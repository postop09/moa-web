import { describe, it, expect } from 'vitest';
import { validateInquiryImages } from './validateInquiryImages';
import { INQUIRY_MAX_IMAGE_BYTES } from '../config/limits';

const file = (size = 1024) => ({ size });

describe('validateInquiryImages', () => {
  it('상수 값 확인: 10MB', () => {
    expect(INQUIRY_MAX_IMAGE_BYTES).toBe(10 * 1024 * 1024);
  });

  it('기존 0장 + 3장은 ok', () => {
    expect(validateInquiryImages(0, [file(), file(), file()])).toEqual({
      ok: true,
    });
  });

  it('기존 2장 + 1장 = 정확히 3장은 ok', () => {
    expect(validateInquiryImages(2, [file()])).toEqual({ ok: true });
  });

  it('합계가 4장이면 count', () => {
    expect(validateInquiryImages(3, [file()])).toEqual({
      ok: false,
      reason: 'count',
    });
    expect(validateInquiryImages(0, [file(), file(), file(), file()])).toEqual({
      ok: false,
      reason: 'count',
    });
  });

  it('정확히 10MB는 ok', () => {
    expect(validateInquiryImages(0, [file(INQUIRY_MAX_IMAGE_BYTES)])).toEqual({
      ok: true,
    });
  });

  it('10MB + 1바이트는 size', () => {
    expect(
      validateInquiryImages(0, [file(INQUIRY_MAX_IMAGE_BYTES + 1)]),
    ).toEqual({
      ok: false,
      reason: 'size',
    });
  });

  it('여러 장 중 하나라도 초과하면 size', () => {
    expect(
      validateInquiryImages(0, [file(), file(INQUIRY_MAX_IMAGE_BYTES + 1)]),
    ).toEqual({
      ok: false,
      reason: 'size',
    });
  });

  it('개수와 크기가 모두 위반이면 count가 우선', () => {
    expect(
      validateInquiryImages(2, [file(INQUIRY_MAX_IMAGE_BYTES + 1), file()]),
    ).toEqual({ ok: false, reason: 'count' });
  });

  it('빈 선택은 ok', () => {
    expect(validateInquiryImages(1, [])).toEqual({ ok: true });
  });
});
