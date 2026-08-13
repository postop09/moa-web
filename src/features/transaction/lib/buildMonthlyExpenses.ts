import type { Transaction } from '@/entities/transaction';

export type MonthlyExpense = {
  key: string;
  label: string;
  amount: number;
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

export const buildMonthlyExpenses = (
  transactions: Transaction[],
  monthCount: number,
  referenceDate = new Date(),
): MonthlyExpense[] => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const buckets: MonthlyExpense[] = [];

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(year, month - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: MONTH_LABELS[date.getMonth()],
      amount: 0,
    });
  }

  const amountByKey = new Map(buckets.map((item) => [item.key, 0]));

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue;
    }

    const date = new Date(transaction.transactionDt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!amountByKey.has(key)) {
      continue;
    }

    amountByKey.set(key, (amountByKey.get(key) ?? 0) + transaction.amount);
  }

  return buckets.map((item) => ({
    ...item,
    amount: amountByKey.get(item.key) ?? 0,
  }));
};
