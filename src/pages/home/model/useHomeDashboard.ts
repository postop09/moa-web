'use client';

import { useCallback, useMemo } from 'react';

import { useListCategories } from '@/features/category';
import {
  buildCategoryBudgets,
  buildDailyExpenses,
  buildExpenseByCategory,
  buildMonthlyExpenses,
  buildWeeklyExpenses,
  getMonthRange,
  getTrailingMonthsRange,
  useListTransactions,
} from '@/features/transaction';

const RECENT_LIMIT = 5;
const MONTH_WINDOW = 6;
const YEAR_WINDOW = 12;

export const useHomeDashboard = (
  householdId: string | null,
  selectedMonth: Date,
) => {
  const monthRange = useMemo(
    () => getMonthRange(selectedMonth),
    [selectedMonth],
  );
  const trailingRange = useMemo(
    () => getTrailingMonthsRange(YEAR_WINDOW, selectedMonth),
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

  const dashboard = useMemo(() => {
    const allTransactions = transactionsQuery.data?.data ?? [];
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
    let insurance = 0;

    for (const transaction of currentMonthTransactions) {
      if (transaction.type === 'income') {
        income += transaction.amount;
      } else if (transaction.type === 'expense') {
        expense += transaction.amount;
      } else if (transaction.type === 'saving') {
        saving += transaction.amount;
      } else if (transaction.type === 'insurance') {
        insurance += transaction.amount;
      }
    }

    const incomeBudgetValues = categories
      .filter((category) => category.type === 'income' && category.budget)
      .map((category) => category.budget as number);

    const incomeTotalBudget = incomeBudgetValues.reduce(
      (sum, value) => sum + value,
      0,
    );

    return {
      income,
      expense,
      saving,
      insurance,
      incomeTotalBudget,
      expenseRate: income === 0 ? null : (expense / income) * 100,
      insuranceRate: income === 0 ? null : (insurance / income) * 100,
      savingRate: income === 0 ? null : (saving / income) * 100,
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
      categories,
      monthlyExpenses: buildMonthlyExpenses(
        allTransactions,
        categories,
        MONTH_WINDOW,
        selectedMonth,
      ),
      weeklyExpenses: buildWeeklyExpenses(
        currentMonthTransactions,
        categories,
        selectedMonth,
      ),
      dailyExpenses: buildDailyExpenses(
        currentMonthTransactions,
        categories,
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

  const { refetch: refetchTransactions } = transactionsQuery;
  const { refetch: refetchCategories } = categoriesQuery;
  const refetch = useCallback(
    () => Promise.all([refetchTransactions(), refetchCategories()]),
    [refetchTransactions, refetchCategories],
  );

  return {
    ...dashboard,
    // 영속화 캐시 복원 중에는 pending + fetchStatus idle이라 isLoading이 false가 된다.
    // householdId가 없으면 enabled: false로 영원히 pending이므로 로딩으로 치지 않는다.
    isLoading:
      !!householdId &&
      (transactionsQuery.isPending || categoriesQuery.isPending),
    isFetching: transactionsQuery.isFetching || categoriesQuery.isFetching,
    hasData:
      transactionsQuery.data !== undefined &&
      categoriesQuery.data !== undefined,
    error: transactionsQuery.error ?? categoriesQuery.error,
    refetch,
  };
};
