import { describe, expect, it } from 'vitest';

import { INQUIRY_CATEGORIES } from '../config/inquiryCategories';
import { INQUIRY_CLASSIFY_THRESHOLD } from '../config/limits';
import {
  INQUIRY_CLASSIFY_CRITERIA,
  INQUIRY_CLASSIFY_INSTRUCTIONS,
} from '../config/classifyCriteria';
import { mapJevCategory } from './mapJevCategory';

describe('INQUIRY_CLASSIFY_THRESHOLD', () => {
  it('0.5 이다', () => {
    expect(INQUIRY_CLASSIFY_THRESHOLD).toBe(0.5);
  });
});

describe('INQUIRY_CLASSIFY_CRITERIA / INSTRUCTIONS', () => {
  it('키가 INQUIRY_CATEGORIES와 정확히 같다', () => {
    expect(Object.keys(INQUIRY_CLASSIFY_CRITERIA).sort()).toEqual(
      [...INQUIRY_CATEGORIES].sort(),
    );
  });

  it('모든 카테고리 설명이 비어 있지 않은 문자열이다', () => {
    INQUIRY_CATEGORIES.forEach((category) => {
      expect(typeof INQUIRY_CLASSIFY_CRITERIA[category]).toBe('string');
      expect(INQUIRY_CLASSIFY_CRITERIA[category].trim().length).toBeGreaterThan(
        0,
      );
    });
  });

  it('설명은 한글을 포함한다', () => {
    INQUIRY_CATEGORIES.forEach((category) => {
      expect(INQUIRY_CLASSIFY_CRITERIA[category]).toMatch(/[가-힣]/);
    });
  });

  it('instructions는 비어 있지 않은 한글 문자열이다', () => {
    expect(INQUIRY_CLASSIFY_INSTRUCTIONS.trim().length).toBeGreaterThan(0);
    expect(INQUIRY_CLASSIFY_INSTRUCTIONS).toMatch(/[가-힣]/);
  });
});

describe('mapJevCategory', () => {
  it('null 입력은 둘 다 null', () => {
    expect(mapJevCategory(null)).toEqual({ category: null, confidence: null });
  });

  it.each(INQUIRY_CATEGORIES)('유효한 choice %s 는 그대로 매핑한다', (key) => {
    expect(mapJevCategory({ choice: key, confidence: 0.9 })).toEqual({
      category: key,
      confidence: 0.9,
    });
  });

  it('알 수 없는 choice는 category null, confidence 유지', () => {
    expect(mapJevCategory({ choice: 'unknown_key', confidence: 0.95 })).toEqual(
      {
        category: null,
        confidence: 0.95,
      },
    );
  });

  it('임계값 미만이면 category null, confidence 유지', () => {
    expect(mapJevCategory({ choice: 'bug_report', confidence: 0.49 })).toEqual({
      category: null,
      confidence: 0.49,
    });
  });

  it('임계값과 정확히 같으면 채택한다', () => {
    expect(mapJevCategory({ choice: 'bug_report', confidence: 0.5 })).toEqual({
      category: 'bug_report',
      confidence: 0.5,
    });
  });

  it('threshold 인자로 기준을 바꿀 수 있다', () => {
    expect(mapJevCategory({ choice: 'other', confidence: 0.7 }, 0.8)).toEqual({
      category: null,
      confidence: 0.7,
    });
    expect(mapJevCategory({ choice: 'other', confidence: 0.7 }, 0.7)).toEqual({
      category: 'other',
      confidence: 0.7,
    });
  });
  it.each([1.5, -0.1, 87, Number.NaN, Number.POSITIVE_INFINITY])(
    'confidence %s 는 범위 밖이라 유효한 choice여도 둘 다 null',
    (confidence) => {
      expect(mapJevCategory({ choice: 'bug_report', confidence })).toEqual({
        category: null,
        confidence: null,
      });
    },
  );

  it('알 수 없는 choice + 범위 밖 confidence도 둘 다 null', () => {
    expect(mapJevCategory({ choice: 'unknown_key', confidence: 1.2 })).toEqual({
      category: null,
      confidence: null,
    });
  });

  it.each([0, 1])('경계값 confidence %i 는 범위 안이다', (confidence) => {
    const result = mapJevCategory({ choice: 'bug_report', confidence }, 0);

    expect(result).toEqual({ category: 'bug_report', confidence });
  });
});
