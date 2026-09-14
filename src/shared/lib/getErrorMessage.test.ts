import { describe, expect, it } from 'vitest';

import { getErrorMessage } from './getErrorMessage';

describe('getErrorMessage', () => {
  it('Error 인스턴스면 message를 그대로 반환한다', () => {
    expect(getErrorMessage(new Error('문제 발생'), '기본 메시지')).toBe(
      '문제 발생',
    );
  });

  it('message가 빈 문자열인 Error도 폴백 없이 빈 문자열을 반환한다', () => {
    // Error.message는 항상 문자열이라 빈 문자열도 "값이 있는" 상태로 취급된다.
    expect(getErrorMessage(new Error(''), '기본 메시지')).toBe('');
  });

  it('message 문자열 필드를 가진 일반 객체는 그 값을 반환한다', () => {
    expect(getErrorMessage({ message: '커스텀 에러' }, '기본 메시지')).toBe(
      '커스텀 에러',
    );
  });

  it('message가 문자열이 아니면 폴백을 반환한다', () => {
    expect(getErrorMessage({ message: 404 }, '기본 메시지')).toBe(
      '기본 메시지',
    );
  });

  it('message 필드가 없으면 폴백을 반환한다', () => {
    expect(getErrorMessage({ code: 'X' }, '기본 메시지')).toBe('기본 메시지');
  });

  it('null/undefined/원시값은 폴백을 반환한다', () => {
    expect(getErrorMessage(null, '기본 메시지')).toBe('기본 메시지');
    expect(getErrorMessage(undefined, '기본 메시지')).toBe('기본 메시지');
    expect(getErrorMessage('문자열 에러', '기본 메시지')).toBe('기본 메시지');
    expect(getErrorMessage(42, '기본 메시지')).toBe('기본 메시지');
  });
});
