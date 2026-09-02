import type { Transaction } from '@/entities/transaction';

export type AssetTrendPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
  saving: number;
  insurance: number;
  asset: number;
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

type MonthlyTotals = {
  income: number;
  expense: number;
  saving: number;
  insurance: number;
};

export const buildAssetTrends = (
  transactions: Transaction[],
  monthCount: number,
  referenceDate = new Date(),
): AssetTrendPoint[] => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const buckets: Array<{ key: string; label: string }> = [];

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(year, month - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: MONTH_LABELS[date.getMonth()],
    });
  }

  const totalsByKey = new Map<string, MonthlyTotals>(
    buckets.map((item) => [
      item.key,
      { income: 0, expense: 0, saving: 0, insurance: 0 },
    ]),
  );

  for (const transaction of transactions) {
    const date = new Date(transaction.transactionDt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const totals = totalsByKey.get(key);
    if (!totals) {
      continue;
    }

    if (transaction.type === 'income') {
      totals.income += transaction.amount;
    } else if (transaction.type === 'expense') {
      totals.expense += transaction.amount;
    } else if (transaction.type === 'saving') {
      totals.saving += transaction.amount;
    } else if (transaction.type === 'insurance') {
      totals.insurance += transaction.amount;
    }
  }

  let cumulativeIncome = 0;
  let cumulativeExpense = 0;
  let cumulativeSaving = 0;
  let cumulativeInsurance = 0;

  return buckets.map((item) => {
    const totals = totalsByKey.get(item.key) ?? {
      income: 0,
      expense: 0,
      saving: 0,
      insurance: 0,
    };
    cumulativeIncome += totals.income;
    cumulativeExpense += totals.expense;
    cumulativeSaving += totals.saving;
    cumulativeInsurance += totals.insurance;

    return {
      key: item.key,
      label: item.label,
      income: cumulativeIncome,
      expense: cumulativeExpense,
      saving: cumulativeSaving,
      insurance: cumulativeInsurance,
      asset: cumulativeIncome - cumulativeExpense - cumulativeInsurance,
    };
  });
};
