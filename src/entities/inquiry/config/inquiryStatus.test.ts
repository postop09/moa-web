import { describe, it, expect } from 'vitest';
import {
  getUserStatusLabel,
  getAdminStatusLabel,
  type InquiryStatus,
} from './inquiryStatus';

describe('getUserStatusLabel', () => {
  it.each<[InquiryStatus, string]>([
    ['waiting', '답변 대기'],
    ['in_progress', '답변 대기'],
    ['answered', '답변 완료'],
    ['closed', '종결'],
  ])('%s -> %s', (status, label) => {
    expect(getUserStatusLabel(status)).toBe(label);
  });

  it('사용자에게는 "처리 중"을 노출하지 않는다', () => {
    expect(getUserStatusLabel('in_progress')).not.toBe('처리 중');
  });
});

describe('getAdminStatusLabel', () => {
  it.each<[InquiryStatus, string]>([
    ['waiting', '답변 대기'],
    ['in_progress', '처리 중'],
    ['answered', '답변 완료'],
    ['closed', '종결'],
  ])('%s -> %s', (status, label) => {
    expect(getAdminStatusLabel(status)).toBe(label);
  });
});
