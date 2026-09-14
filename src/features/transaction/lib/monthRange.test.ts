import { describe, expect, it } from 'vitest';

import { getMonthRange, getTrailingMonthsRange } from './monthRange';

// 이 모듈은 KST(UTC+9, DST 없음)로 경계를 고정 계산하므로 테스트 실행 환경의
// TZ와 무관하게 결과가 결정적이다(vitest.config.mts의 TZ 고정과도 독립적).

describe('getMonthRange', () => {
  it('월 중간 시각 기준으로 그 달의 KST 00:00~23:59:59.999 경계를 반환한다', () => {
    const result = getMonthRange(new Date('2025-03-15T00:00:00.000Z'));

    expect(result.from).toBe('2025-02-28T15:00:00.000Z');
    expect(result.to).toBe('2025-03-31T14:59:59.999Z');
  });

  it('UTC로는 전날이지만 KST로는 이미 다음 달인 시각은 다음 달 경계를 반환한다', () => {
    // 2025-03-31T15:30:00Z + 9h = 2025-04-01T00:30 KST → 4월로 판정돼야 한다.
    const result = getMonthRange(new Date('2025-03-31T15:30:00.000Z'));

    expect(result.from).toBe('2025-03-31T15:00:00.000Z');
    expect(result.to).toBe('2025-04-30T14:59:59.999Z');
  });

  it('윤년 2월의 마지막 날을 29일로 정확히 계산한다', () => {
    const result = getMonthRange(new Date('2024-02-15T00:00:00.000Z'));

    expect(result.from).toBe('2024-01-31T15:00:00.000Z');
    expect(result.to).toBe('2024-02-29T14:59:59.999Z');
  });

  it('평년 2월의 마지막 날은 28일이다', () => {
    const result = getMonthRange(new Date('2025-02-15T00:00:00.000Z'));

    expect(result.to).toBe('2025-02-28T14:59:59.999Z');
  });

  it('12월 기준이면 다음 해로 넘어가지 않고 그해 12월 경계를 반환한다', () => {
    const result = getMonthRange(new Date('2025-12-10T00:00:00.000Z'));

    expect(result.from).toBe('2025-11-30T15:00:00.000Z');
    expect(result.to).toBe('2025-12-31T14:59:59.999Z');
  });
});

describe('getTrailingMonthsRange', () => {
  it('monthCount가 1이면 getMonthRange와 동일한 결과다', () => {
    const referenceDate = new Date('2025-03-15T00:00:00.000Z');

    expect(getTrailingMonthsRange(1, referenceDate)).toEqual(
      getMonthRange(referenceDate),
    );
  });

  it('연도 경계를 넘는 구간도 정확히 계산한다(2025-01 기준 최근 3개월)', () => {
    const result = getTrailingMonthsRange(
      3,
      new Date('2025-01-15T00:00:00.000Z'),
    );

    // 2024-11-01 00:00 KST ~ 2025-01-31 23:59:59.999 KST
    expect(result.from).toBe('2024-10-31T15:00:00.000Z');
    expect(result.to).toBe('2025-01-31T14:59:59.999Z');
  });

  it('monthCount만큼 과거로 확장하되 끝은 항상 기준월 말일이다', () => {
    const result = getTrailingMonthsRange(
      12,
      new Date('2025-06-10T00:00:00.000Z'),
    );

    expect(result.from).toBe('2024-06-30T15:00:00.000Z');
    expect(result.to).toBe('2025-06-30T14:59:59.999Z');
  });
});
