import { describe, expect, it } from 'vitest';

import { formatHolidayNames, getHolidayNames } from './holidays';

describe('getHolidayNames', () => {
  it('신정(1월 1일)을 반환한다', () => {
    expect(getHolidayNames('2026-01-01')).toEqual(['1월 1일']);
  });

  it('추석을 반환한다', () => {
    expect(getHolidayNames('2026-09-25')).toEqual(['추석']);
  });

  it('한글날을 반환한다', () => {
    expect(getHolidayNames('2026-10-09')).toEqual(['한글날']);
  });

  it('공휴일이 겹치는 날은 이름을 모두 반환한다 (어린이날 + 부처님 오신 날)', () => {
    expect(getHolidayNames('2025-05-05')).toEqual([
      '어린이날',
      '부처님 오신 날',
    ]);
  });

  it('공휴일이 아닌 평일은 undefined를 반환한다', () => {
    expect(getHolidayNames('2026-01-02')).toBeUndefined();
  });

  it('공휴일이 아닌 다른 달의 날짜도 undefined를 반환한다', () => {
    expect(getHolidayNames('2026-06-15')).toBeUndefined();
  });
});

describe('formatHolidayNames', () => {
  it('공휴일명이 하나면 그대로 반환한다', () => {
    expect(formatHolidayNames(['한글날'])).toBe('한글날');
  });

  it('공휴일명이 여러 개면 쉼표로 join한다', () => {
    expect(formatHolidayNames(['어린이날', '부처님 오신 날'])).toBe(
      '어린이날, 부처님 오신 날',
    );
  });
});
