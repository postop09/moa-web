import { describe, expect, it } from 'vitest';

import { parseStatusParam } from './parseStatusParam';

describe('parseStatusParam', () => {
  it.each(['all', 'waiting', 'answered', 'closed'] as const)(
    '유효한 값 %s 는 그대로 돌려준다',
    (value) => {
      expect(parseStatusParam(value)).toBe(value);
    },
  );

  it('값이 없으면 all', () => {
    expect(parseStatusParam(undefined)).toBe('all');
  });

  it.each(['', 'in_progress', 'WAITING', 'unknown', ' waiting'])(
    '알 수 없는 값 "%s" 는 all',
    (value) => {
      expect(parseStatusParam(value)).toBe('all');
    },
  );

  it('같은 키가 여러 번 오면(배열) 첫 값을 기준으로 검증한다', () => {
    expect(parseStatusParam(['answered', 'closed'])).toBe('answered');
    expect(parseStatusParam(['bogus', 'closed'])).toBe('all');
    expect(parseStatusParam([])).toBe('all');
  });
});
