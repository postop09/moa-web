import type { Transaction } from '@/entities/transaction';

export type CumulativeSavingPoint = {
  key: string;
  label: string;
  amount: number;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLabel = (date: Date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const startOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const buildCumulativeSavings = (
  transactions: Transaction[],
  endDate: Date | string = new Date(),
): CumulativeSavingPoint[] => {
  const end = startOfDay(new Date(endDate));
  const dailySaving = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== 'saving') {
      continue;
    }

    const date = startOfDay(new Date(transaction.transactionDt));
    if (date.getTime() > end.getTime()) {
      continue;
    }

    const key = toDateKey(date);
    dailySaving.set(key, (dailySaving.get(key) ?? 0) + transaction.amount);
  }

  if (dailySaving.size === 0) {
    return [];
  }

  const firstKey = [...dailySaving.keys()].sort()[0];
  const cursor = startOfDay(new Date(`${firstKey}T00:00:00`));
  const points: CumulativeSavingPoint[] = [];
  let cumulative = 0;

  while (cursor.getTime() <= end.getTime()) {
    const key = toDateKey(cursor);
    cumulative += dailySaving.get(key) ?? 0;
    points.push({
      key,
      label: toLabel(cursor),
      amount: cumulative,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
};
