import { describe, expect, it } from 'vitest';

import { getAuthCompletePath, getSafeNextPath } from './getSafeNextPath';

describe('getSafeNextPath', () => {
  it('null/undefined/빈 문자열은 null을 반환한다', () => {
    expect(getSafeNextPath(null)).toBeNull();
    expect(getSafeNextPath(undefined)).toBeNull();
    expect(getSafeNextPath('')).toBeNull();
  });

  it('허용된 앱 경로는 그대로 반환한다', () => {
    expect(getSafeNextPath('/')).toBe('/');
    expect(getSafeNextPath('/history')).toBe('/history');
    expect(getSafeNextPath('/stats')).toBe('/stats');
    expect(getSafeNextPath('/calendar')).toBe('/calendar');
    expect(getSafeNextPath('/settings')).toBe('/settings');
    expect(getSafeNextPath('/write')).toBe('/write');
    expect(getSafeNextPath('/write/12')).toBe('/write/12');
  });

  it('숫자가 아닌 write 하위 경로는 거부한다', () => {
    expect(getSafeNextPath('/write/abc')).toBeNull();
  });

  it('허용 목록에 없는 경로는 거부한다', () => {
    expect(getSafeNextPath('/unknown')).toBeNull();
    expect(getSafeNextPath('/history/1')).toBeNull();
  });

  it('초대 경로는 UUID 형식을 대소문자 구분 없이 허용한다', () => {
    const lower = '/invite/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const upper = '/invite/AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE';

    expect(getSafeNextPath(lower)).toBe(lower);
    expect(getSafeNextPath(upper)).toBe(upper);
  });

  it('UUID 형식이 아닌 초대 경로는 거부한다', () => {
    expect(getSafeNextPath('/invite/not-a-uuid')).toBeNull();
  });

  it('프로토콜이 포함된 절대 URL은 오픈 리다이렉트 방지를 위해 거부한다', () => {
    expect(getSafeNextPath('https://evil.com')).toBeNull();
    expect(getSafeNextPath('http://evil.com/history')).toBeNull();
  });

  it('스킴 없는 프로토콜 상대 경로(//)는 거부한다', () => {
    expect(getSafeNextPath('//evil.com')).toBeNull();
  });

  it('백슬래시가 포함된 경로는 거부한다', () => {
    expect(getSafeNextPath('/\\evil.com')).toBeNull();
  });

  it('쿼리스트링이나 해시가 포함된 경로는 거부한다', () => {
    expect(getSafeNextPath('/history?x=1')).toBeNull();
    expect(getSafeNextPath('/history#section')).toBeNull();
  });
});

describe('getAuthCompletePath', () => {
  it('next가 없으면 기본 경로를 반환한다', () => {
    expect(getAuthCompletePath()).toBe('/auth/complete');
    expect(getAuthCompletePath(null)).toBe('/auth/complete');
    expect(getAuthCompletePath(undefined)).toBe('/auth/complete');
    expect(getAuthCompletePath('')).toBe('/auth/complete');
  });

  it('next가 있으면 인코딩해 쿼리로 붙인다', () => {
    expect(getAuthCompletePath('/history')).toBe(
      '/auth/complete?next=%2Fhistory',
    );
  });

  it('next에 특수문자가 있어도 안전하게 인코딩한다', () => {
    expect(getAuthCompletePath('/write?x=1&y=2')).toBe(
      `/auth/complete?next=${encodeURIComponent('/write?x=1&y=2')}`,
    );
  });
});
