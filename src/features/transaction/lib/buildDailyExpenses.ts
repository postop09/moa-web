import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

export type DailyExpenseCategory = {
  id: number | null;
  name: string;
  amount: number;
};

export type DailyExpense = {
  key: string;
  day: number;
  label: string;
  amount: number;
  byCategory: DailyExpenseCategory[];
};

type DayBucket = {
  key: string;
  day: number;
  from: number;
  to: number;
  amountByCategory: Map<number | null, number>;
};

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

const buildDayBuckets = (referenceDate: Date): DayBucket[] => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const buckets: DayBucket[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const from = new Date(year, month, day, 0, 0, 0, 0);
    const to = new Date(year, month, day, 23, 59, 59, 999);

    buckets.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      from: from.getTime(),
      to: to.getTime(),
      amountByCategory: new Map(),
    });
  }

  return buckets;
};

export const buildDailyExpenses = (
  transactions: Transaction[],
  categories: Category[],
  referenceDate = new Date(),
): DailyExpense[] => {
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const buckets = buildDayBuckets(referenceDate);

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue;
    }

    const time = new Date(transaction.transactionDt).getTime();
    const bucket = buckets.find((item) => time >= item.from && time <= item.to);
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
      day: item.day,
      label: String(item.day),
      amount: byCategory.reduce((sum, category) => sum + category.amount, 0),
      byCategory,
    };
  });
};
