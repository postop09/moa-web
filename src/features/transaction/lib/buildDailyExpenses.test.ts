import { describe, expect, it } from 'vitest';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

import { buildDailyExpenses } from './buildDailyExpenses';

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

describe('buildDailyExpenses', () => {
  it('그 달의 일수만큼 버킷을 만든다(31일)', () => {
    const result = buildDailyExpenses([], [], new Date(2025, 2, 15)); // 2025-03

    expect(result).toHaveLength(31);
    expect(result[0]).toMatchObject({ key: '2025-03-01', day: 1, label: '1' });
    expect(result[30]).toMatchObject({
      key: '2025-03-31',
      day: 31,
      label: '31',
    });
  });

  it('30일까지 있는 달은 30개 버킷을 만든다', () => {
    const result = buildDailyExpenses([], [], new Date(2025, 3, 15)); // 2025-04

    expect(result).toHaveLength(30);
  });

  it('윤년 2월은 29개, 평년 2월은 28개 버킷을 만든다', () => {
    expect(buildDailyExpenses([], [], new Date(2024, 1, 10))).toHaveLength(29);
    expect(buildDailyExpenses([], [], new Date(2025, 1, 10))).toHaveLength(28);
  });

  it('해당 일자의 지출을 정확한 버킷에 합산한다', () => {
    const transactions = [
      makeTransaction({
        amount: 1000,
        categoryId: 1,
        transactionDt: '2025-03-10T00:00:00.000Z', // KST 3/10 09:00
      }),
      makeTransaction({
        amount: 2000,
        categoryId: 1,
        transactionDt: '2025-03-10T14:00:00.000Z', // KST 3/10 23:00
      }),
    ];

    const result = buildDailyExpenses(
      transactions,
      [FOOD],
      new Date(2025, 2, 15),
    );

    expect(result[9]?.amount).toBe(3000);
    expect(result[9]?.key).toBe('2025-03-10');
  });

  it('type이 expense가 아닌 거래는 제외한다', () => {
    const transactions = [
      makeTransaction({
        type: 'income',
        amount: 5000,
        transactionDt: '2025-03-10T00:00:00.000Z',
      }),
    ];

    const result = buildDailyExpenses(
      transactions,
      [FOOD],
      new Date(2025, 2, 15),
    );

    expect(result[9]?.amount).toBe(0);
  });

  it('알 수 없는 categoryId와 null categoryId 모두 미분류로 합류한다', () => {
    const transactions = [
      makeTransaction({
        amount: 500,
        categoryId: null,
        transactionDt: '2025-03-05T00:00:00.000Z',
      }),
      makeTransaction({
        amount: 700,
        categoryId: 999,
        transactionDt: '2025-03-05T01:00:00.000Z',
      }),
    ];

    const result = buildDailyExpenses(
      transactions,
      [FOOD],
      new Date(2025, 2, 15),
    );

    expect(result[4]?.byCategory).toEqual([
      { id: null, name: '미분류', amount: 1200 },
    ]);
  });
});
