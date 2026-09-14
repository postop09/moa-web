import { describe, expect, it } from 'vitest';

import {
  isSameDay,
  isSameMonth,
  shiftMonth,
  shiftYear,
  startOfDay,
  startOfMonth,
} from './month';

describe('startOfMonth', () => {
  it('해당 달 1일 00:00으로 맞춘다', () => {
    const result = startOfMonth(new Date(2025, 2, 15, 13, 30));
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
  });
});

describe('startOfDay', () => {
  it('시각을 00:00으로 맞추고 날짜는 유지한다', () => {
    const result = startOfDay(new Date(2025, 2, 15, 23, 59));
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});

describe('shiftMonth', () => {
  it('delta만큼 달을 이동하고 1일로 맞춘다(원래 일자는 유지하지 않는다)', () => {
    const result = shiftMonth(new Date(2025, 2, 31), 1);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(1);
  });

  it('연말에서 다음 달로 이동하면 연도가 넘어간다', () => {
    const result = shiftMonth(new Date(2025, 11, 15), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0);
  });

  it('연초에서 이전 달로 이동하면 연도가 줄어든다', () => {
    const result = shiftMonth(new Date(2025, 0, 15), -1);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(11);
  });

  it('delta 0이면 같은 달의 1일을 반환한다', () => {
    const result = shiftMonth(new Date(2025, 5, 20), 0);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(1);
  });
});

describe('shiftYear', () => {
  it('delta만큼 연도를 이동하고 1일로 맞춘다', () => {
    const result = shiftYear(new Date(2025, 5, 20), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(1);
  });

  it('음수 delta면 과거 연도로 이동한다', () => {
    const result = shiftYear(new Date(2025, 5, 20), -3);
    expect(result.getFullYear()).toBe(2022);
    expect(result.getMonth()).toBe(5);
  });
});

describe('isSameMonth', () => {
  it('연·월이 같으면 true다', () => {
    expect(isSameMonth(new Date(2025, 2, 1), new Date(2025, 2, 28))).toBe(true);
  });

  it('연이 다르면 월이 같아도 false다', () => {
    expect(isSameMonth(new Date(2024, 2, 1), new Date(2025, 2, 1))).toBe(false);
  });

  it('월이 다르면 false다', () => {
    expect(isSameMonth(new Date(2025, 1, 28), new Date(2025, 2, 1))).toBe(
      false,
    );
  });
});

describe('isSameDay', () => {
  it('연·월·일이 같으면 시각이 달라도 true다', () => {
    expect(
      isSameDay(new Date(2025, 2, 15, 0, 0), new Date(2025, 2, 15, 23, 59)),
    ).toBe(true);
  });

  it('일이 다르면 false다', () => {
    expect(isSameDay(new Date(2025, 2, 15), new Date(2025, 2, 16))).toBe(false);
  });
});
