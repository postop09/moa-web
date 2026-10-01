import { describe, expect, it } from 'vitest';

import { parseWriteMode } from './parseWriteMode';

const ID = '123e4567-e89b-12d3-a456-426614174000';

describe('parseWriteMode', () => {
  it('파라미터가 없으면 new', () => {
    expect(parseWriteMode({})).toEqual({ mode: 'new' });
  });

  it('followUp / edit 에 uuid 가 있으면 해당 모드', () => {
    expect(parseWriteMode({ followUp: ID })).toEqual({
      mode: 'followUp',
      inquiryId: ID,
    });
    expect(parseWriteMode({ edit: ID })).toEqual({
      mode: 'edit',
      inquiryId: ID,
    });
  });

  it('배열이면 첫 값을 쓴다', () => {
    expect(parseWriteMode({ edit: [ID, 'x'] })).toEqual({
      mode: 'edit',
      inquiryId: ID,
    });
  });

  it('uuid 형식이 아니면 new 로 되돌린다', () => {
    expect(parseWriteMode({ followUp: 'abc', edit: '../x' })).toEqual({
      mode: 'new',
    });
  });

  it('둘 다 유효하면 followUp 이 우선한다', () => {
    expect(parseWriteMode({ followUp: ID, edit: ID }).mode).toBe('followUp');
  });
});
