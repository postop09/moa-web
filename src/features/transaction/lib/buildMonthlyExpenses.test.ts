import { describe, expect, it } from 'vitest';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

import { buildMonthlyExpenses } from './buildMonthlyExpenses';

let nextId = 1;

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: nextId++,
  householdId: 'household-1',
  type: 'expense',
  name: null,
  amount: 0,
  isRecurring: null,
  recurringDay: null,
  recurringSourceId: null,
  categoryId: null,
  memo: null,
  createdBy: 'user-1',
  createdDt: '2025-01-01T00:00:00.000Z',
  updatedDt: '2025-01-01T00:00:00.000Z',
  transactionDt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeCategory = (overrides: Partial<Category>): Category => ({
  id: 1,
  householdId: 'household-1',
  name: '카테고리',
  type: 'expense',
  budget: null,
  created_at: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const FOOD = makeCategory({ id: 1, name: '식비' });

describe('buildMonthlyExpenses', () => {
  it('monthCount만큼 과거→현재 순 버킷을 만들고 마지막이 기준월이다', () => {
    const result = buildMonthlyExpenses(
      [],
      [],
      3,
      new Date(2025, 5, 15), // 2025-06
    );

    expect(result.map((item) => item.key)).toEqual([
      '2025-04',
      '2025-05',
      '2025-06',
    ]);
    expect(result.map((item) => item.label)).toEqual(['4월', '5월', '6월']);
  });

  it('연을 넘는 버킷도 정확히 계산한다', () => {
    const result = buildMonthlyExpenses([], [], 3, new Date(2025, 1, 10)); // 2025-02

    expect(result.map((item) => item.key)).toEqual([
      '2024-12',
      '2025-01',
      '2025-02',
    ]);
  });

  it('type이 expense가 아닌 거래는 집계에서 제외한다', () => {
    const transactions = [
      makeTransaction({
        type: 'income',
        amount: 10000,
        transactionDt: '2025-06-10T00:00:00.000Z',
      }),
    ];

    const result = buildMonthlyExpenses(
      transactions,
      [FOOD],
      1,
      new Date(2025, 5, 15),
    );

    expect(result[0]?.amount).toBe(0);
  });

  it('기준 범위 밖의 거래는 무시한다', () => {
    const transactions = [
      makeTransaction({
        amount: 5000,
        transactionDt: '2025-01-10T00:00:00.000Z',
      }),
    ];

    const result = buildMonthlyExpenses(
      transactions,
      [FOOD],
      1,
      new Date(2025, 5, 15), // 2025-06, 1월 거래는 범위 밖
    );

    expect(result[0]?.amount).toBe(0);
  });

  it('같은 달의 지출을 카테고리별로 합산하고 금액 내림차순으로 정렬한다', () => {
    const transactions = [
      makeTransaction({
        amount: 3000,
        categoryId: 1,
        transactionDt: '2025-06-05T00:00:00.000Z',
      }),
      makeTransaction({
        amount: 7000,
        categoryId: 1,
        transactionDt: '2025-06-20T00:00:00.000Z',
      }),
      makeTransaction({
        amount: 5000,
        categoryId: 2,
        transactionDt: '2025-06-12T00:00:00.000Z',
      }),
    ];
    const categories = [FOOD, makeCategory({ id: 2, name: '교통' })];

    const result = buildMonthlyExpenses(
      transactions,
      categories,
      1,
      new Date(2025, 5, 15),
    );

    expect(result[0]?.amount).toBe(15000);
    expect(result[0]?.byCategory).toEqual([
      { id: 1, name: '식비', amount: 10000 },
      { id: 2, name: '교통', amount: 5000 },
    ]);
  });

  it('알 수 없는 categoryId와 null categoryId는 모두 미분류로 합류한다', () => {
    const transactions = [
      makeTransaction({
        amount: 1000,
        categoryId: null,
        transactionDt: '2025-06-01T00:00:00.000Z',
      }),
      makeTransaction({
        amount: 2000,
        categoryId: 999,
        transactionDt: '2025-06-02T00:00:00.000Z',
      }),
    ];

    const result = buildMonthlyExpenses(
      transactions,
      [FOOD],
      1,
      new Date(2025, 5, 15),
    );

    expect(result[0]?.byCategory).toEqual([
      { id: null, name: '미분류', amount: 3000 },
    ]);
  });
});
