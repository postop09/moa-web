import { describe, expect, it } from 'vitest';

import { formatWaitingTime } from './formatWaitingTime';

// 어드민 목록(pages/adminInquiries)에서 entities/admin/lib 로 올린 헬퍼. 동작은 그대로다.
describe('formatWaitingTime', () => {
  it.each([
    [0, '1시간 미만'],
    [1, '1시간'],
    [5, '5시간'],
    [23, '23시간'],
    [24, '1일'],
    [25, '1일 1시간'],
    [48, '2일'],
    [51, '2일 3시간'],
  ])('%i시간 -> %s', (hours, expected) => {
    expect(formatWaitingTime(hours)).toBe(expected);
  });
});
