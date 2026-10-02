import { describe, expect, it } from 'vitest';

import {
  ADMIN_INQUIRY_KEYWORD_MIN,
  ADMIN_INQUIRY_PAGE_SIZES,
  ADMIN_INQUIRY_PERIODS,
} from './index';

describe('@/entities/admin 공개 상수', () => {
  it('페이지 크기는 20/50/100 이다', () => {
    expect(ADMIN_INQUIRY_PAGE_SIZES).toEqual([20, 50, 100]);
  });

  it('고를 수 있는 기간은 7/30/90 일이다 (전체는 null 이라 포함하지 않는다)', () => {
    expect(ADMIN_INQUIRY_PERIODS).toEqual([7, 30, 90]);
  });

  it('키워드 최소 길이는 2 다', () => {
    expect(ADMIN_INQUIRY_KEYWORD_MIN).toBe(2);
  });
});
