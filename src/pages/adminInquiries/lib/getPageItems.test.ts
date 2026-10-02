import { describe, expect, it } from 'vitest';

import { getPageItems } from './getPageItems';

describe('getPageItems', () => {
  it('페이지가 하나면 1 뿐이다', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(1, 0)).toEqual([1]);
  });

  it('적으면 전부 보여준다', () => {
    expect(getPageItems(2, 3)).toEqual([1, 2, 3]);
    expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('앞쪽에서는 뒤만 접는다', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 'ellipsis-end', 20]);
  });

  it('가운데에서는 양쪽을 접는다', () => {
    expect(getPageItems(10, 20)).toEqual([
      1,
      'ellipsis-start',
      8,
      9,
      10,
      11,
      12,
      'ellipsis-end',
      20,
    ]);
  });

  it('윈도우가 처음·끝 쪽에 닿으면 말줄임 없이 이어 붙인다', () => {
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPageItems(5, 8)).toEqual([1, 'ellipsis-start', 3, 4, 5, 6, 7, 8]);
    expect(getPageItems(4, 8)).toEqual([1, 2, 3, 4, 5, 6, 'ellipsis-end', 8]);
  });

  it('현재 페이지는 항상 포함되고 처음·끝 쪽도 항상 포함된다', () => {
    for (let current = 1; current <= 20; current += 1) {
      const items = getPageItems(current, 20);

      expect(items).toContain(current);
      expect(items[0]).toBe(1);
      expect(items[items.length - 1]).toBe(20);
    }
  });

  it('끝쪽에서는 앞만 접는다', () => {
    expect(getPageItems(20, 20)).toEqual([1, 'ellipsis-start', 18, 19, 20]);
  });
});
