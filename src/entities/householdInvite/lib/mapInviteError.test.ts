import { describe, expect, it } from 'vitest';

import { mapInviteError } from './mapInviteError';

// 이 파일은 D-4(getErrorCode 유틸 추가 + mapInviteError 리팩터)에 앞서
// "현재 동작을 고정"하기 위한 회귀 테스트다. 리팩터 여부와 무관하게 지금 코드로도
// 반드시 통과해야 한다.
describe('mapInviteError', () => {
  it('code가 23505면 중복 초대 메시지를 반환한다', () => {
    const result = mapInviteError({ code: '23505', message: 'duplicate key' });

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('이미 초대한 이메일입니다.');
  });

  it('code가 숫자 23505여도 문자열 변환 후 중복 초대 메시지를 반환한다', () => {
    const result = mapInviteError({ code: 23505, message: 'duplicate key' });

    expect(result.message).toBe('이미 초대한 이메일입니다.');
  });

  it('message가 MESSAGE_MAP 키를 포함하면 매핑된 한글 메시지를 반환한다', () => {
    expect(mapInviteError({ message: 'not authenticated' }).message).toBe(
      '로그인이 필요합니다.',
    );
    expect(mapInviteError({ message: 'invite not found' }).message).toBe(
      '초대를 찾을 수 없습니다.',
    );
    expect(mapInviteError({ message: 'invite is not pending' }).message).toBe(
      '이미 처리된 초대입니다.',
    );
    expect(mapInviteError({ message: 'profile not found' }).message).toBe(
      '프로필이 필요합니다.',
    );
    expect(mapInviteError({ message: 'invite email mismatch' }).message).toBe(
      '초대받은 이메일과 로그인 계정이 다릅니다.',
    );
    expect(mapInviteError({ message: 'already a member' }).message).toBe(
      '이미 이 가계부의 멤버입니다.',
    );
  });

  it('message가 키를 부분 문자열로만 포함해도 매핑된다', () => {
    const result = mapInviteError({
      message: 'Error: not authenticated (401)',
    });

    expect(result.message).toBe('로그인이 필요합니다.');
  });

  it('Error 인스턴스를 넘기면 매핑된 메시지로 치환된 새 Error를 반환한다', () => {
    const result = mapInviteError(new Error('not authenticated'));

    expect(result.message).toBe('로그인이 필요합니다.');
  });

  it('Error 인스턴스이고 매핑되는 메시지가 없으면 원본 Error를 그대로 반환한다', () => {
    const original = new Error('unknown db error');

    const result = mapInviteError(original);

    expect(result).toBe(original);
    expect(result.message).toBe('unknown db error');
  });

  it('매핑되지 않는 message를 가진 일반 객체는 그 message를 그대로 담은 Error를 반환한다', () => {
    // 주의: 이 케이스는 fallback 문구가 아니라 입력받은 message 문자열이 그대로 반환된다.
    // (fallback은 message 필드 자체가 없거나 빈 문자열일 때만 사용됨 — 아래 테스트 참고)
    const result = mapInviteError({ message: 'unknown db error' });

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('unknown db error');
  });

  it('message 필드가 없는 객체는 fallback 메시지를 반환한다', () => {
    const result = mapInviteError({});

    expect(result.message).toBe('초대 처리에 실패했습니다.');
  });

  it('null을 넘기면 fallback 메시지를 반환한다', () => {
    const result = mapInviteError(null);

    expect(result.message).toBe('초대 처리에 실패했습니다.');
  });

  it('undefined를 넘기면 fallback 메시지를 반환한다', () => {
    const result = mapInviteError(undefined);

    expect(result.message).toBe('초대 처리에 실패했습니다.');
  });

  it('객체가 아닌 값(문자열)을 넘기면 fallback 메시지를 반환한다', () => {
    const result = mapInviteError('some string error');

    expect(result.message).toBe('초대 처리에 실패했습니다.');
  });
});
