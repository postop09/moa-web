import { describe, expect, it } from 'vitest';

import { isUuid } from './isUuid';

describe('isUuid', () => {
  it('UUID 형식은 대소문자 구분 없이 통과한다', () => {
    expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isUuid('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
  });

  it.each([
    undefined,
    null,
    1,
    '',
    'inq-1',
    '123e4567e89b12d3a456426614174000',
  ])('%s 은 거부한다', (value) => {
    expect(isUuid(value)).toBe(false);
  });
});
