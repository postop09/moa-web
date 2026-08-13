'use client';

import { useMemo } from 'react';

import { getMonthRange } from '../lib/monthRange';
import { useListTransactions } from './useListTransactions';

export const useMonthlyStatus = (householdId: string | null) => {
  const range = useMemo(() => getMonthRange(), []);

  const query = useListTransactions(
    householdId
      ? {
          householdId,
          from: range.from,
          to: range.to,
        }
      : null,
  );

  const status = useMemo(() => {
    const transactions = query.data ?? [];
    let income = 0;
    let expense = 0;

    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
      }
    }

    return {
      income,
      expense,
      saving: income - expense,
    };
  }, [query.data]);

  return {
    ...status,
    isLoading: query.isLoading,
    error: query.error,
  };
};
