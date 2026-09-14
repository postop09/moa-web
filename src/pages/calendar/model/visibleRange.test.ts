import { describe, expect, it } from 'vitest';

import {
  VISIBLE_DAY_COUNT,
  getVisibleCalendarDays,
  getVisibleCalendarRange,
  parseDayKey,
  toDayKey,
} from './visibleRange';

describe('getVisibleCalendarDays', () => {
  it('항상 42일을 반환한다', () => {
    const result = getVisibleCalendarDays(new Date(2025, 2, 15));

    expect(result).toHaveLength(VISIBLE_DAY_COUNT);
  });

  it('그리드는 항상 일요일부터 시작한다(2025년 3월은 1일이 토요일)', () => {
    const result = getVisibleCalendarDays(new Date(2025, 2, 15));

    expect(result[0]?.getDay()).toBe(0);
    expect(result[0]?.toDateString()).toBe(
      new Date(2025, 1, 23).toDateString(),
    );
  });

  it('마지막 날은 토요일이고 다음 달까지 이어질 수 있다', () => {
    const result = getVisibleCalendarDays(new Date(2025, 2, 15));
    const last = result[41];

    expect(last?.getDay()).toBe(6);
    expect(last?.toDateString()).toBe(new Date(2025, 3, 5).toDateString());
  });

  it('1일이 일요일인 달은 그리드가 그 달 1일부터 시작한다', () => {
    // 2025-06-01은 일요일이다.
    const result = getVisibleCalendarDays(new Date(2025, 5, 10));

    expect(result[0]?.toDateString()).toBe(new Date(2025, 5, 1).toDateString());
  });
});

describe('getVisibleCalendarRange', () => {
  it('그리드 첫날 00:00부터 마지막날 23:59:59.999까지를 반환한다', () => {
    const result = getVisibleCalendarRange(new Date(2025, 2, 15));

    expect(result.from).toBe(new Date(2025, 1, 23, 0, 0, 0, 0).toISOString());
    expect(result.to).toBe(new Date(2025, 3, 5, 23, 59, 59, 999).toISOString());
  });
});

describe('toDayKey / parseDayKey', () => {
  it('toDayKey는 YYYY-MM-DD 형식으로 만든다', () => {
    expect(toDayKey(new Date(2025, 2, 5))).toBe('2025-03-05');
    expect(toDayKey(new Date(2025, 11, 31))).toBe('2025-12-31');
  });

  it('parseDayKey는 toDayKey의 결과를 원래 날짜로 복원한다(왕복 검증)', () => {
    const keys = ['2025-01-01', '2025-03-05', '2025-12-31'];

    keys.forEach((key) => {
      const parsed = parseDayKey(key);
      expect(parsed).not.toBeNull();
      expect(toDayKey(parsed as Date)).toBe(key);
    });
  });

  it('숫자가 아닌 조각이 있으면 null을 반환한다', () => {
    expect(parseDayKey('abc-de-fg')).toBeNull();
    expect(parseDayKey('2025-XX-05')).toBeNull();
  });

  it('빈 문자열은 null을 반환한다', () => {
    // ''.split('-')는 [''] 하나뿐이라 month/day가 undefined → Number(undefined)는
    // NaN이라 isFinite 검사에서 걸러진다. 반면 '0-0-0'처럼 세 조각이 모두
    // 존재하면 Number('0')===0(유한값)이라 걸러지지 않고 날짜가 만들어진다.
    expect(parseDayKey('')).toBeNull();
    expect(parseDayKey('0-0-0')).not.toBeNull();
  });
});
