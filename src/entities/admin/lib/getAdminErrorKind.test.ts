import { describe, expect, it } from 'vitest';

import { getAdminErrorKind } from './getAdminErrorKind';

describe('getAdminErrorKind', () => {
  describe('RPC 에러 코드(메시지)', () => {
    it.each([
      ['conflict', 'conflict'],
      ['forbidden', 'forbidden'],
      ['unauthorized', 'forbidden'],
      ['uncategorized', 'uncategorized'],
      ['invalid_state', 'invalid_state'],
      ['not_found', 'not_found'],
      ['invalid_body', 'invalid_body'],
      ['invalid_attachments', 'invalid_attachments'],
    ] as const)(
      'PostgREST 형태 {code, message:%j} 는 %j',
      (message, expected) => {
        expect(getAdminErrorKind({ code: 'P0001', message })).toBe(expected);
      },
    );

    it('Error 인스턴스의 message 도 같은 규칙으로 읽는다', () => {
      expect(getAdminErrorKind(new Error('conflict'))).toBe('conflict');
      expect(getAdminErrorKind(new Error('not_found'))).toBe('not_found');
    });

    it('message 가 코드를 포함하기만 해도(앞뒤에 문구가 붙어도) 찾는다', () => {
      expect(getAdminErrorKind({ message: 'rpc failed: conflict (409)' })).toBe(
        'conflict',
      );
    });

    it('invalid_attachments 는 invalid_body 등 다른 invalid_ 코드와 구분한다', () => {
      expect(getAdminErrorKind({ message: 'invalid_attachments' })).toBe(
        'invalid_attachments',
      );
      expect(getAdminErrorKind({ message: 'invalid_body' })).toBe(
        'invalid_body',
      );
    });

    it('토큰은 대소문자를 구분한다', () => {
      expect(getAdminErrorKind({ message: 'CONFLICT' })).toBe('unknown');
      expect(getAdminErrorKind({ message: 'Forbidden' })).toBe('unknown');
    });
  });

  describe('네트워크', () => {
    it.each([
      new TypeError('Failed to fetch'),
      new TypeError('Load failed'),
      new Error('NetworkError when attempting to fetch resource.'),
    ])('%s 는 network', (error) => {
      expect(getAdminErrorKind(error)).toBe('network');
    });
  });

  describe('알 수 없는 오류', () => {
    it.each([
      [new Error('boom')],
      [{ code: '23514', message: 'check violation' }],
      [{ code: 'P0001', message: 'invalid_status' }],
      [{}],
      ['conflict'],
      [null],
      [undefined],
      [42],
    ])('%j 는 unknown', (error) => {
      expect(getAdminErrorKind(error)).toBe('unknown');
    });
  });
});
