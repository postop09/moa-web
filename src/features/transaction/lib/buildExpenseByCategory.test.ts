import { describe, expect, it } from 'vitest';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

import { buildExpenseByCategory } from './buildExpenseByCategory';

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

describe('buildExpenseByCategory', () => {
  it('type이 expense가 아닌 거래는 제외한다', () => {
    const transactions = [makeTransaction({ type: 'income', amount: 1000 })];

    expect(buildExpenseByCategory(transactions, [])).toEqual([]);
  });

  it('카테고리별로 합산하고 금액 내림차순으로 정렬한다', () => {
    const categories = [
      makeCategory({ id: 1, name: '식비' }),
      makeCategory({ id: 2, name: '교통' }),
    ];
    const transactions = [
      makeTransaction({ categoryId: 1, amount: 3000 }),
      makeTransaction({ categoryId: 1, amount: 2000 }),
      makeTransaction({ categoryId: 2, amount: 9000 }),
    ];

    const result = buildExpenseByCategory(transactions, categories);

    expect(result).toEqual([
      { id: 2, name: '교통', amount: 9000 },
      { id: 1, name: '식비', amount: 5000 },
    ]);
  });

  it('categoryId가 null이면 미분류로 집계한다', () => {
    const transactions = [
      makeTransaction({ categoryId: null, amount: 1000 }),
      makeTransaction({ categoryId: null, amount: 500 }),
    ];

    const result = buildExpenseByCategory(transactions, []);

    expect(result).toEqual([{ id: null, name: '미분류', amount: 1500 }]);
  });

  it('categories 목록에 없는 categoryId는 숫자 id를 유지한 채 미분류로 이름만 표시한다', () => {
    // buildMonthlyExpenses/buildDailyExpenses/buildWeeklyExpenses와 달리
    // 이 함수는 미지의 categoryId를 null로 합치지 않고 원래 id를 보존한다.
    const transactions = [makeTransaction({ categoryId: 999, amount: 100 })];

    const result = buildExpenseByCategory(transactions, []);

    expect(result).toEqual([{ id: 999, name: '미분류', amount: 100 }]);
  });

  it('카테고리가 16개를 넘으면 상위 15개만 반환하고 나머지는 버린다', () => {
    const categories = Array.from({ length: 16 }, (_, index) =>
      makeCategory({ id: index + 1, name: `카테고리${index + 1}` }),
    );
    const transactions = categories.map((category) =>
      makeTransaction({ categoryId: category.id, amount: category.id }),
    );

    const result = buildExpenseByCategory(transactions, categories);

    expect(result).toHaveLength(15);
    // 금액 내림차순이므로 상위 15개는 id 16(amount 16)부터 id 2(amount 2)까지고,
    // 가장 적은 id 1(amount 1)은 절단돼 결과에 없다.
    expect(result.map((item) => item.id)).not.toContain(1);
  });
});
