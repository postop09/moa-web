import { describe, it, expect, afterEach } from 'vitest';
import {
  formatInquiryListDate,
  formatInquiryDetailDate,
} from './formatInquiryDate';

describe('formatInquiryDate', () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it('목록은 MM.DD', () => {
    expect(formatInquiryListDate('2026-09-30T16:30:00Z')).toBe('10.01');
  });

  it('상세는 MM.DD HH:mm', () => {
    expect(formatInquiryDetailDate('2026-09-30T16:30:00Z')).toBe('10.01 01:30');
  });

  it('한 자리 월·일·시·분은 0으로 채운다', () => {
    expect(formatInquiryListDate('2026-01-04T00:05:00Z')).toBe('01.04');
    expect(formatInquiryDetailDate('2026-01-04T00:05:00Z')).toBe('01.04 09:05');
  });

  it('자정은 24:00이 아니라 00:00', () => {
    expect(formatInquiryDetailDate('2026-09-30T15:00:00Z')).toBe('10.01 00:00');
  });

  it('연말 경계: UTC 12/31 15:00 -> KST 01.01', () => {
    expect(formatInquiryListDate('2026-12-31T15:00:00Z')).toBe('01.01');
  });

  it('머신 타임존이 UTC여도 Asia/Seoul 기준', () => {
    process.env.TZ = 'UTC';
    expect(formatInquiryListDate('2026-09-30T16:30:00Z')).toBe('10.01');
    expect(formatInquiryDetailDate('2026-09-30T16:30:00Z')).toBe('10.01 01:30');
  });

  it('머신 타임존이 America/Los_Angeles여도 Asia/Seoul 기준', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(formatInquiryDetailDate('2026-09-30T16:30:00Z')).toBe('10.01 01:30');
  });
});
