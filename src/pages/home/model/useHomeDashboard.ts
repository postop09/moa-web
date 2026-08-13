'use client';

import { useMemo, useState } from 'react';

import { useListCategories } from '@/features/category';
import {
  buildCategoryBudgets,
  buildExpenseByCategory,
  buildMonthlyExpenses,
  getMonthRange,
  getTrailingMonthsRange,
  useListTransactions,
} from '@/features/transaction';

const RECENT_LIMIT = 5;
const MONTH_WINDOW = 6;

const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const shiftMonth = (date: Date, delta: number) => {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
};

const isSameMonth = (a: Date, b: Date) => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

export const useHomeDashboard = (householdId: string | null) => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  const monthRange = useMemo(
    () => getMonthRange(selectedMonth),
    [selectedMonth],
  );
  const trailingRange = useMemo(
    () => getTrailingMonthsRange(MONTH_WINDOW, selectedMonth),
    [selectedMonth],
  );

  const transactionsQuery = useListTransactions(
    householdId
      ? {
          householdId,
          from: trailingRange.from,
          to: trailingRange.to,
        }
      : null,
  );
  const categoriesQuery = useListCategories(householdId);

  const canGoNext = !isSameMonth(selectedMonth, startOfMonth(new Date()));

  const goPrevMonth = () => {
    setSelectedMonth((current) => shiftMonth(current, -1));
  };

  const goNextMonth = () => {
    setSelectedMonth((current) => {
      const next = shiftMonth(current, 1);
      const currentMonth = startOfMonth(new Date());
      if (next.getTime() > currentMonth.getTime()) {
        return current;
      }
      return next;
    });
  };

  const dashboard = useMemo(() => {
    const allTransactions = transactionsQuery.data ?? [];
    const categories = categoriesQuery.data ?? [];
    const monthFrom = new Date(monthRange.from).getTime();
    const monthTo = new Date(monthRange.to).getTime();

    const currentMonthTransactions = allTransactions.filter((transaction) => {
      const time = new Date(transaction.transactionDt).getTime();
      return time >= monthFrom && time <= monthTo;
    });

    let income = 0;
    let expense = 0;
    let saving = 0;

    for (const transaction of currentMonthTransactions) {
      if (transaction.type === 'income') {
        income += transaction.amount;
      } else if (transaction.type === 'expense') {
        expense += transaction.amount;
      } else if (transaction.type === 'saving') {
        saving += transaction.amount;
      }
    }

    const budgetValues = categories
      .filter((category) => category.type === 'expense' && category.budget !== null)
      .map((category) => category.budget as number);

    const budgetTotal =
      budgetValues.length === 0
        ? null
        : budgetValues.reduce((sum, value) => sum + value, 0);

    const budgetRemaining =
      budgetTotal === null ? null : budgetTotal - expense;

    return {
      income,
      expense,
      saving,
      savingRate: income === 0 ? null : (saving / income) * 100,
      budgetTotal,
      budgetRemaining,
      expenseByCategory: buildExpenseByCategory(
        currentMonthTransactions,
        categories,
      ),
      categoryBudgets: buildCategoryBudgets(
        currentMonthTransactions,
        categories,
      ),
      recentTransactions: [...currentMonthTransactions]
        .sort(
          (a, b) =>
            new Date(b.transactionDt).getTime() -
            new Date(a.transactionDt).getTime(),
        )
        .slice(0, RECENT_LIMIT),
      monthlyExpenses: buildMonthlyExpenses(
        allTransactions,
        MONTH_WINDOW,
        selectedMonth,
      ),
    };
  }, [
    categoriesQuery.data,
    monthRange.from,
    monthRange.to,
    selectedMonth,
    transactionsQuery.data,
  ]);

  return {
    ...dashboard,
    selectedMonth,
    canGoNext,
    goPrevMonth,
    goNextMonth,
    isLoading: transactionsQuery.isLoading || categoriesQuery.isLoading,
    error: transactionsQuery.error ?? categoriesQuery.error,
  };
};
