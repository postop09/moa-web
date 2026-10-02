import { describe, it, expect } from 'vitest';
import { getWaitingHours, isOverdue } from './getWaitingHours';

const HOUR = 60 * 60 * 1000;
const since = '2026-10-01T00:00:00Z';
const base = Date.parse(since);

describe('getWaitingHours', () => {
  it('같은 시각이면 0', () => {
    expect(getWaitingHours(since, base)).toBe(0);
  });

  it('1시간 미만은 0 (내림)', () => {
    expect(getWaitingHours(since, base + HOUR - 1)).toBe(0);
  });

  it('정확히 N시간이면 N', () => {
    expect(getWaitingHours(since, base + 24 * HOUR)).toBe(24);
  });

  it('N시간 59분은 N (내림)', () => {
    expect(getWaitingHours(since, base + 25 * HOUR + 59 * 60 * 1000)).toBe(25);
  });

  it('now가 과거면 음수 대신 0', () => {
    expect(getWaitingHours(since, base - 5 * HOUR)).toBe(0);
  });
});

describe('isOverdue', () => {
  it('24시간은 경고 아님', () => {
    expect(isOverdue(24)).toBe(false);
  });

  it('25시간은 경고', () => {
    expect(isOverdue(25)).toBe(true);
  });

  it('0시간은 경고 아님', () => {
    expect(isOverdue(0)).toBe(false);
  });
});
