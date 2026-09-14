import { describe, expect, it } from 'vitest';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

import { buildWeeklyExpenses } from './buildWeeklyExpenses';

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

// 2025년 3월 1일은 토요일이라, 1주차는 3/1~3/2(2일)뿐인 부분 주로 시작해
// 마지막 6주차는 3/31 하루만 남는 부분 주로 끝난다(월 전체 일수 = 31일,
// 5개 온전한 일~토 주 + 앞뒤 부분 주 2개).
const REFERENCE_DATE = new Date(2025, 2, 15);

describe('buildWeeklyExpenses', () => {
  it('월 전체를 부분 주 포함 6개 버킷으로 나눈다', () => {
    const result = buildWeeklyExpenses([], [], REFERENCE_DATE);

    expect(result.map((item) => item.key)).toEqual([
      '2025-03-w1',
      '2025-03-w2',
      '2025-03-w3',
      '2025-03-w4',
      '2025-03-w5',
      '2025-03-w6',
    ]);
    expect(result.map((item) => item.label)).toEqual([
      '1주차',
      '2주차',
      '3주차',
      '4주차',
      '5주차',
      '6주차',
    ]);
  });

  it('첫 주는 월초부터 첫 일요일까지의 부분 주다', () => {
    const transactions = [
      makeTransaction({
        amount: 1000,
        transactionDt: '2025-03-01T00:00:00.000Z', // KST 3/1 09:00
      }),
      makeTransaction({
        amount: 2000,
        transactionDt: '2025-03-02T14:00:00.000Z', // KST 3/2 23:00
      }),
      makeTransaction({
        amount: 9999,
        transactionDt: '2025-03-03T00:00:00.000Z', // KST 3/3 09:00 → 2주차
      }),
    ];

    const result = buildWeeklyExpenses(transactions, [FOOD], REFERENCE_DATE);

    expect(result[0]?.amount).toBe(3000);
    expect(result[1]?.amount).toBe(9999);
  });

  it('마지막 주는 월말에서 잘리는 부분 주다(3/31 하루만)', () => {
    const transactions = [
      makeTransaction({
        amount: 1000,
        transactionDt: '2025-03-31T05:00:00.000Z', // KST 3/31 14:00
      }),
    ];

    const result = buildWeeklyExpenses(transactions, [FOOD], REFERENCE_DATE);

    expect(result[5]?.key).toBe('2025-03-w6');
    expect(result[5]?.amount).toBe(1000);
  });

  it('type이 expense가 아닌 거래는 제외한다', () => {
    const transactions = [
      makeTransaction({
        type: 'saving',
        amount: 5000,
        transactionDt: '2025-03-10T00:00:00.000Z',
      }),
    ];

    const result = buildWeeklyExpenses(transactions, [FOOD], REFERENCE_DATE);

    expect(result.reduce((sum, item) => sum + item.amount, 0)).toBe(0);
  });

  it('알 수 없는 categoryId는 미분류로 합류한다', () => {
    const transactions = [
      makeTransaction({
        amount: 1500,
        categoryId: 999,
        transactionDt: '2025-03-10T00:00:00.000Z',
      }),
    ];

    const result = buildWeeklyExpenses(transactions, [FOOD], REFERENCE_DATE);
    const week3 = result.find((item) => item.key === '2025-03-w3');

    expect(week3?.byCategory).toEqual([
      { id: null, name: '미분류', amount: 1500 },
    ]);
  });
});
