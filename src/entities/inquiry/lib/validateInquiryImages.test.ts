import { describe, it, expect } from 'vitest';
import { validateInquiryImages } from './validateInquiryImages';
import { INQUIRY_MAX_IMAGE_BYTES } from '../config/limits';

const file = (size = 1024) => ({ size });
const typed = (type: string, size = 1024) => ({ size, type });

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
  describe('MIME 형식', () => {
    it.each([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ])('%s 는 ok', (type) => {
      expect(validateInquiryImages(0, [typed(type)])).toEqual({ ok: true });
    });

    it.each(['image/gif', 'image/svg+xml', 'application/pdf', 'text/plain'])(
      '%s 는 type',
      (type) => {
        expect(validateInquiryImages(0, [typed(type)])).toEqual({
          ok: false,
          reason: 'type',
        });
      },
    );

    it('여러 장 중 하나라도 형식이 틀리면 type', () => {
      expect(
        validateInquiryImages(0, [typed('image/png'), typed('image/gif')]),
      ).toEqual({ ok: false, reason: 'type' });
    });

    it('type 이 없는(undefined) 입력은 형식 검사를 건너뛴다', () => {
      expect(validateInquiryImages(0, [file()])).toEqual({ ok: true });
    });
  });

  describe('type 이 빈 문자열일 때 (일부 브라우저의 HEIC) 확장자로 판단', () => {
    const named = (name: string, type = '', size = 1024) => ({
      size,
      type,
      name,
    });

    it.each([
      'a.heic',
      'a.heif',
      'a.jpg',
      'a.jpeg',
      'a.png',
      'a.webp',
      'IMG_1.HEIC',
      'IMG_1.Jpeg',
      'my.photo.PNG',
    ])('%s 는 ok', (name) => {
      expect(validateInquiryImages(0, [named(name)])).toEqual({ ok: true });
    });

    it.each(['a.gif', 'a.pdf', 'a.svg', 'noext', 'a.heic.exe', 'a.'])(
      '%s 는 type',
      (name) => {
        expect(validateInquiryImages(0, [named(name)])).toEqual({
          ok: false,
          reason: 'type',
        });
      },
    );

    it('type 이 빈 문자열이고 name 도 없으면 type', () => {
      expect(validateInquiryImages(0, [{ size: 1, type: '' }])).toEqual({
        ok: false,
        reason: 'type',
      });
    });

    it('알려진 type 이 허용 목록 밖이면 이름이 .png 여도 type', () => {
      expect(validateInquiryImages(0, [named('a.png', 'image/gif')])).toEqual({
        ok: false,
        reason: 'type',
      });
    });

    it('허용된 type 이면 이름 확장자와 무관하게 ok', () => {
      expect(validateInquiryImages(0, [named('a.img', 'image/png')])).toEqual({
        ok: true,
      });
    });

    it('type 이 undefined 이면 name 이 있어도 건너뛴다 (기존 동작)', () => {
      expect(validateInquiryImages(0, [{ size: 1, name: 'a.gif' }])).toEqual({
        ok: true,
      });
    });

    it('확장자로 통과해도 크기 초과면 size', () => {
      expect(
        validateInquiryImages(0, [
          named('a.heic', '', INQUIRY_MAX_IMAGE_BYTES + 1),
        ]),
      ).toEqual({ ok: false, reason: 'size' });
    });
  });

  describe('우선순위: count > type > size', () => {
    it('개수 + 형식 위반이면 count', () => {
      expect(validateInquiryImages(3, [typed('image/gif')])).toEqual({
        ok: false,
        reason: 'count',
      });
    });

    it('개수 + 크기 + 형식 위반이면 count', () => {
      expect(
        validateInquiryImages(2, [
          typed('image/gif', INQUIRY_MAX_IMAGE_BYTES + 1),
          typed('image/png'),
        ]),
      ).toEqual({ ok: false, reason: 'count' });
    });

    it('형식 + 크기 위반이면 type', () => {
      expect(
        validateInquiryImages(0, [
          typed('image/gif', INQUIRY_MAX_IMAGE_BYTES + 1),
        ]),
      ).toEqual({ ok: false, reason: 'type' });
    });

    it('형식이 올바른 파일이 크기만 초과하면 size', () => {
      expect(
        validateInquiryImages(0, [
          typed('image/heic', INQUIRY_MAX_IMAGE_BYTES + 1),
        ]),
      ).toEqual({ ok: false, reason: 'size' });
    });

    it('한 파일은 크기 초과, 다른 파일은 형식 위반이면 type', () => {
      expect(
        validateInquiryImages(0, [
          typed('image/png', INQUIRY_MAX_IMAGE_BYTES + 1),
          typed('image/gif'),
        ]),
      ).toEqual({ ok: false, reason: 'type' });
    });
  });
});
