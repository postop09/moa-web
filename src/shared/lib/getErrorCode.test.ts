import { describe, expect, it } from 'vitest';

import { getErrorCode } from './getErrorCode';

describe('getErrorCode', () => {
  it('code 필드가 문자열이면 그대로 반환한다', () => {
    expect(getErrorCode({ code: 'PGRST116' })).toBe('PGRST116');
  });

  it('code 필드가 숫자면 문자열로 변환해 반환한다', () => {
    expect(getErrorCode({ code: 23505 })).toBe('23505');
  });

  it('code 필드가 없는 객체는 null을 반환한다', () => {
    expect(getErrorCode({ message: 'boom' })).toBeNull();
  });

  it('빈 객체는 null을 반환한다', () => {
    expect(getErrorCode({})).toBeNull();
  });

  it('null은 null을 반환한다', () => {
    expect(getErrorCode(null)).toBeNull();
  });

  it('undefined는 null을 반환한다', () => {
    expect(getErrorCode(undefined)).toBeNull();
  });

  it('문자열처럼 객체가 아닌 값은 null을 반환한다', () => {
    expect(getErrorCode('error string')).toBeNull();
  });

  it('숫자처럼 객체가 아닌 값은 null을 반환한다', () => {
    expect(getErrorCode(42)).toBeNull();
  });

  it('Error 인스턴스에 code가 없으면 null을 반환한다', () => {
    expect(getErrorCode(new Error('plain error'))).toBeNull();
  });

  it('Error 인스턴스에 code가 있으면 문자열로 변환해 반환한다', () => {
    const error = new Error('with code') as Error & { code: string };
    error.code = 'PGRST116';

    expect(getErrorCode(error)).toBe('PGRST116');
  });
});
