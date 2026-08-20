import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

export type MonthlyExpenseCategory = {
  id: number | null;
  name: string;
  amount: number;
};

export type MonthlyExpense = {
  key: string;
  label: string;
  amount: number;
  byCategory: MonthlyExpenseCategory[];
};

const MONTH_LABELS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
] as const;

const getCategoryName = (
  categoryId: number | null,
  categoryNameById: Map<number, string>,
) => {
  if (categoryId === null) {
    return '미분류';
  }

  return categoryNameById.get(categoryId) ?? '미분류';
};

const getCategoryKey = (
  categoryId: number | null,
  categoryNameById: Map<number, string>,
) => {
  if (categoryId === null || !categoryNameById.has(categoryId)) {
    return null;
  }

  return categoryId;
};

export const buildMonthlyExpenses = (
  transactions: Transaction[],
  categories: Category[],
  monthCount: number,
  referenceDate = new Date(),
): MonthlyExpense[] => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const buckets: Array<{
    key: string;
    label: string;
    amountByCategory: Map<number | null, number>;
  }> = [];

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(year, month - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: MONTH_LABELS[date.getMonth()],
      amountByCategory: new Map(),
    });
  }

  const bucketByKey = new Map(buckets.map((item) => [item.key, item]));

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue;
    }

    const date = new Date(transaction.transactionDt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = bucketByKey.get(key);
    if (!bucket) {
      continue;
    }

    const categoryKey = getCategoryKey(
      transaction.categoryId,
      categoryNameById,
    );
    bucket.amountByCategory.set(
      categoryKey,
      (bucket.amountByCategory.get(categoryKey) ?? 0) + transaction.amount,
    );
  }

  return buckets.map((item) => {
    const byCategory = [...item.amountByCategory.entries()]
      .map(([id, amount]) => ({
        id,
        name: getCategoryName(id, categoryNameById),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      key: item.key,
      label: item.label,
      amount: byCategory.reduce((sum, category) => sum + category.amount, 0),
      byCategory,
    };
  });
};
