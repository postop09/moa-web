import { describe, expect, it } from 'vitest';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

import { buildCategoryBudgets } from './buildCategoryBudgets';

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

describe('buildCategoryBudgets', () => {
  it('type이 expense가 아닌 카테고리는 결과에서 제외한다', () => {
    const categories = [makeCategory({ id: 1, type: 'income' })];

    expect(buildCategoryBudgets([], categories)).toEqual([]);
  });

  it('해당 카테고리의 지출만 합산한다', () => {
    const categories = [makeCategory({ id: 1, name: '식비', budget: 10000 })];
    const transactions = [
      makeTransaction({ categoryId: 1, amount: 3000 }),
      makeTransaction({ categoryId: 1, amount: 2000 }),
      makeTransaction({ categoryId: 2, amount: 9999 }), // 다른 카테고리
      makeTransaction({ categoryId: 1, amount: 1000, type: 'income' }), // expense 아님
    ];

    const result = buildCategoryBudgets(transactions, categories);

    expect(result).toEqual([
      { id: 1, name: '식비', spent: 5000, budget: 10000, ratio: 0.5 },
    ]);
  });

  it('budget이 0이고 지출이 있으면 ratio는 Infinity다', () => {
    const categories = [makeCategory({ id: 1, budget: 0 })];
    const transactions = [makeTransaction({ categoryId: 1, amount: 100 })];

    const result = buildCategoryBudgets(transactions, categories);

    expect(result[0]?.ratio).toBe(Number.POSITIVE_INFINITY);
  });

  it('budget이 0이고 지출이 없으면 ratio는 0이다', () => {
    const categories = [makeCategory({ id: 1, budget: 0 })];

    const result = buildCategoryBudgets([], categories);

    expect(result[0]?.ratio).toBe(0);
  });

  it('budget이 null이면 ratio도 null이고 정렬에서 가장 낮은 순위로 취급된다', () => {
    const categories = [
      makeCategory({ id: 1, name: '예산없음', budget: null }),
      makeCategory({ id: 2, name: '예산있음', budget: 1000 }),
    ];
    const transactions = [makeTransaction({ categoryId: 2, amount: 500 })];

    const result = buildCategoryBudgets(transactions, categories);

    expect(result.map((item) => item.name)).toEqual(['예산있음', '예산없음']);
    expect(result[1]?.ratio).toBeNull();
  });

  it('ratio 내림차순으로 정렬한다', () => {
    const categories = [
      makeCategory({ id: 1, name: 'A', budget: 1000 }),
      makeCategory({ id: 2, name: 'B', budget: 1000 }),
      makeCategory({ id: 3, name: 'C', budget: 1000 }),
    ];
    const transactions = [
      makeTransaction({ categoryId: 1, amount: 200 }), // ratio 0.2
      makeTransaction({ categoryId: 2, amount: 900 }), // ratio 0.9
      makeTransaction({ categoryId: 3, amount: 500 }), // ratio 0.5
    ];

    const result = buildCategoryBudgets(transactions, categories);

    expect(result.map((item) => item.name)).toEqual(['B', 'C', 'A']);
  });

  it('카테고리에 지출 데이터가 없으면 spent는 0이다', () => {
    const categories = [makeCategory({ id: 1, budget: 1000 })];

    const result = buildCategoryBudgets([], categories);

    expect(result[0]).toEqual({
      id: 1,
      name: '카테고리',
      spent: 0,
      budget: 1000,
      ratio: 0,
    });
  });
});
