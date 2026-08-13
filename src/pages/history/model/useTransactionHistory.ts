'use client';

import { useMemo, useState } from 'react';

import { useListCategories } from '@/features/category';
import {
  getMonthRange,
  useListTransactions,
} from '@/features/transaction';
import type { TransactionType } from '@/shared/model';

export type TypeFilter = TransactionType | 'all';
export type CategoryFilter = number | 'all';

const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const shiftMonth = (date: Date, delta: number) => {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
};

const isSameMonth = (a: Date, b: Date) => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

export const useTransactionHistory = (householdId: string | null) => {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(() =>
    startOfMonth(new Date()),
  );
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryId, setCategoryId] = useState<CategoryFilter>('all');

  const monthRange = useMemo(() => {
    if (selectedMonth === null) {
      return null;
    }
    return getMonthRange(selectedMonth);
  }, [selectedMonth]);

  const transactionsQuery = useListTransactions(
    householdId
      ? {
          householdId,
          from: monthRange?.from,
          to: monthRange?.to,
        }
      : null,
  );
  const categoriesQuery = useListCategories(householdId);

  const categories = categoriesQuery.data ?? [];

  const categoryOptions = useMemo(() => {
    if (typeFilter === 'all') {
      return categories;
    }
    return categories.filter((category) => category.type === typeFilter);
  }, [categories, typeFilter]);

  const handleTypeFilterChange = (next: TypeFilter) => {
    setTypeFilter(next);
    setCategoryId((current) => {
      if (current === 'all') {
        return current;
      }
      const stillValid = categories.some(
        (category) =>
          category.id === current &&
          (next === 'all' || category.type === next),
      );
      return stillValid ? current : 'all';
    });
  };

  const canGoNext =
    selectedMonth !== null &&
    !isSameMonth(selectedMonth, startOfMonth(new Date()));

  const goPrevMonth = () => {
    setSelectedMonth((current) => {
      if (current === null) {
        return startOfMonth(new Date());
      }
      return shiftMonth(current, -1);
    });
  };

  const goNextMonth = () => {
    setSelectedMonth((current) => {
      if (current === null) {
        return startOfMonth(new Date());
      }
      const next = shiftMonth(current, 1);
      const currentMonth = startOfMonth(new Date());
      if (next.getTime() > currentMonth.getTime()) {
        return current;
      }
      return next;
    });
  };

  const clearMonthFilter = () => {
    setSelectedMonth(null);
  };

  const transactions = useMemo(() => {
    const list = transactionsQuery.data ?? [];

    return list
      .filter((transaction) => {
        if (typeFilter !== 'all' && transaction.type !== typeFilter) {
          return false;
        }
        if (categoryId !== 'all' && transaction.categoryId !== categoryId) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.transactionDt).getTime() -
          new Date(a.transactionDt).getTime(),
      );
  }, [categoryId, transactionsQuery.data, typeFilter]);

  return {
    selectedMonth,
    typeFilter,
    categoryId,
    categoryOptions,
    categories,
    transactions,
    canGoNext,
    goPrevMonth,
    goNextMonth,
    clearMonthFilter,
    setTypeFilter: handleTypeFilterChange,
    setCategoryId,
    isLoading: transactionsQuery.isLoading || categoriesQuery.isLoading,
    error: transactionsQuery.error ?? categoriesQuery.error,
  };
};
