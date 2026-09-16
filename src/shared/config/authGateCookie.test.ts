import { describe, expect, it } from 'vitest';

import {
  AUTH_GATE_COOKIE_OPTIONS,
  AUTH_GATE_READY_PREFIX,
  getAuthGateReadyUserId,
  toAuthGateReadyValue,
} from './authGateCookie';

describe('AUTH_GATE_COOKIE_OPTIONS', () => {
  it('설치형 PWA 재실행 후에도 유지되도록 maxAge가 30일(초 단위)이다', () => {
    expect(AUTH_GATE_COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 24 * 30);
  });

  it('기존 보안 속성(httpOnly, sameSite, path)을 유지한다', () => {
    expect(AUTH_GATE_COOKIE_OPTIONS).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  });
});

describe('toAuthGateReadyValue', () => {
  it('userId 앞에 ready 접두사를 붙인다', () => {
    expect(toAuthGateReadyValue('user-1')).toBe(
      `${AUTH_GATE_READY_PREFIX}user-1`,
    );
  });
});

describe('getAuthGateReadyUserId', () => {
  it('ready 접두사가 붙은 값에서 userId를 꺼낸다', () => {
    expect(getAuthGateReadyUserId('ready:user-1')).toBe('user-1');
  });

  it('접두사가 없으면 null을 반환한다', () => {
    expect(getAuthGateReadyUserId('user-1')).toBeNull();
  });

  it('userId가 비어 있으면 null을 반환한다', () => {
    expect(getAuthGateReadyUserId('ready:')).toBeNull();
  });

  it('값이 undefined이면 null을 반환한다', () => {
    expect(getAuthGateReadyUserId(undefined)).toBeNull();
  });
});
