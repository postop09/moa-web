import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

export type ExpenseByCategory = {
  id: number | null;
  name: string;
  amount: number;
};

const TOP_CATEGORY_COUNT = 6;

export const buildExpenseByCategory = (
  transactions: Transaction[],
  categories: Category[],
): ExpenseByCategory[] => {
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const expenseMap = new Map<number | null, number>();

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue;
    }

    const key = transaction.categoryId;
    expenseMap.set(key, (expenseMap.get(key) ?? 0) + transaction.amount);
  }

  const sorted = [...expenseMap.entries()]
    .map(([id, amount]) => ({
      id,
      name: id === null ? '미분류' : (categoryNameById.get(id) ?? '미분류'),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (sorted.length <= TOP_CATEGORY_COUNT) {
    return sorted;
  }

  const top = sorted.slice(0, TOP_CATEGORY_COUNT);
  const restAmount = sorted
    .slice(TOP_CATEGORY_COUNT)
    .reduce((sum, item) => sum + item.amount, 0);

  if (restAmount <= 0) {
    return top;
  }

  return [
    ...top,
    {
      id: null,
      name: '기타',
      amount: restAmount,
    },
  ];
};
