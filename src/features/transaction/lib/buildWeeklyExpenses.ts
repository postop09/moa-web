import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

export type WeeklyExpenseCategory = {
  id: number | null;
  name: string;
  amount: number;
};

export type WeeklyExpense = {
  key: string;
  label: string;
  amount: number;
  byCategory: WeeklyExpenseCategory[];
};

type WeekBucket = {
  key: string;
  label: string;
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

const buildWeekBuckets = (referenceDate: Date): WeekBucket[] => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const buckets: WeekBucket[] = [];
  let weekStart = new Date(monthStart);
  let weekIndex = 1;

  while (weekStart.getTime() <= monthEnd.getTime()) {
    const day = weekStart.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + daysUntilSunday);
    weekEnd.setHours(23, 59, 59, 999);

    if (weekEnd.getTime() > monthEnd.getTime()) {
      weekEnd.setTime(monthEnd.getTime());
    }

    buckets.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}-w${weekIndex}`,
      label: `${weekIndex}주차`,
      from: weekStart.getTime(),
      to: weekEnd.getTime(),
      amountByCategory: new Map(),
    });

    weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() + 1);
    weekStart.setHours(0, 0, 0, 0);
    weekIndex += 1;
  }

  return buckets;
};

export const buildWeeklyExpenses = (
  transactions: Transaction[],
  categories: Category[],
  referenceDate = new Date(),
): WeeklyExpense[] => {
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const buckets = buildWeekBuckets(referenceDate);

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
      label: item.label,
      amount: byCategory.reduce((sum, category) => sum + category.amount, 0),
      byCategory,
    };
  });
};
