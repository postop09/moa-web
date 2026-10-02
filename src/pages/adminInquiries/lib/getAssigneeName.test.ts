import { describe, expect, it } from 'vitest';

import { getAssigneeName } from './getAssigneeName';

describe('getAssigneeName', () => {
  it('이메일의 @ 앞부분만 돌려준다', () => {
    expect(getAssigneeName('opa@moa.test')).toBe('opa');
  });

  it('이메일이 없으면 미지정', () => {
    expect(getAssigneeName(null)).toBe('미지정');
    expect(getAssigneeName('')).toBe('미지정');
  });

  it('@ 앞이 비어 있으면 전체 문자열', () => {
    expect(getAssigneeName('@moa.test')).toBe('@moa.test');
  });
});
