import { describe, expect, it } from 'vitest';

import { isDefinitiveRejection } from './isDefinitiveRejection';

// supabase-js 는 fetch 실패도 던지지 않고 이런 객체로 돌려준다. code 가 "빈 문자열" 인 점이 함정이다.
const NETWORK_SHAPE = {
  message: 'TypeError: Failed to fetch',
  details: '',
  hint: '',
  code: '',
};

describe('isDefinitiveRejection', () => {
  describe('네트워크 실패는 서버가 처리했을 수도 있어 확정 거절이 아니다', () => {
    it('supabase-js 가 보고하는 실제 모양(code 가 빈 문자열)은 false 다', () => {
      expect(isDefinitiveRejection(NETWORK_SHAPE)).toBe(false);
    });

    it.each(['Load failed', 'NetworkError when attempting to fetch'])(
      '브라우저별 네트워크 메시지 %j 도 같은 모양이면 false 다',
      (message) => {
        expect(isDefinitiveRejection({ ...NETWORK_SHAPE, message })).toBe(
          false,
        );
      },
    );

    it("TypeError('Failed to fetch') 는 false 다", () => {
      expect(isDefinitiveRejection(new TypeError('Failed to fetch'))).toBe(
        false,
      );
    });

    it('알 수 없는 Error 는 false 다', () => {
      expect(isDefinitiveRejection(new Error('boom'))).toBe(false);
      expect(isDefinitiveRejection(new Error('rpc'))).toBe(false);
    });
  });

  describe('비어 있지 않은 문자열 code(PostgREST)는 확정 거절이다', () => {
    it.each([
      ['RPC RAISE', { code: 'P0001', message: 'conflict' }],
      ['check violation', { code: '23514', message: 'check violation' }],
      [
        '메시지가 무엇이든',
        { code: 'XX000', message: 'secret internal detail' },
      ],
      ['code 가 붙은 Error', Object.assign(new Error('x'), { code: 'P0001' })],
      ['메시지가 없는 객체', { code: '42501' }],
    ])('%s 는 true 다', (_name, error) => {
      expect(isDefinitiveRejection(error)).toBe(true);
    });

    it('빈 문자열·null·숫자 code 는 code 로 치지 않는다', () => {
      expect(isDefinitiveRejection({ code: '', message: 'x' })).toBe(false);
      expect(isDefinitiveRejection({ code: null, message: 'x' })).toBe(false);
      expect(isDefinitiveRejection({ code: 500, message: 'x' })).toBe(false);
    });
  });

  describe('code 가 없어도 메시지가 RPC 토큰으로 시작하면 확정 거절이다', () => {
    it.each([
      'invalid_title',
      'invalid_state',
      'invalid_body',
      'forbidden',
      'not_found: inquiry',
      'unauthorized',
      'conflict',
      'uncategorized',
      'already_rated',
    ])('Error(%j) 는 true 다', (message) => {
      expect(isDefinitiveRejection(new Error(message))).toBe(true);
    });

    it("plain Error('conflict') 와 message 만 있는 객체도 true 다", () => {
      expect(isDefinitiveRejection(new Error('conflict'))).toBe(true);
      expect(isDefinitiveRejection({ message: 'conflict' })).toBe(true);
    });

    it('빈 code 가 있어도 메시지가 토큰으로 시작하면 true 다', () => {
      expect(isDefinitiveRejection({ code: '', message: 'conflict' })).toBe(
        true,
      );
    });

    it('토큰이 메시지 중간에 들어 있기만 하면 false 다 (시작해야 한다)', () => {
      expect(isDefinitiveRejection(new Error('db said conflict'))).toBe(false);
      expect(
        isDefinitiveRejection({ ...NETWORK_SHAPE, message: 'x forbidden' }),
      ).toBe(false);
    });
  });

  describe('오류로 볼 수 없는 값은 false 다', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['빈 문자열', ''],
      ['토큰 문자열', 'conflict'],
      ['코드 문자열', '23514'],
      ['숫자', 500],
      ['빈 객체', {}],
    ])('%s', (_name, error) => {
      expect(isDefinitiveRejection(error)).toBe(false);
    });
  });
});
