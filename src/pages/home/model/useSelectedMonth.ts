'use client';

import { useState } from 'react';

const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const shiftMonth = (date: Date, delta: number) => {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
};

const isSameMonth = (a: Date, b: Date) => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

export const useSelectedMonth = () => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    startOfMonth(new Date()),
  );

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

  return {
    selectedMonth,
    canGoNext,
    goPrevMonth,
    goNextMonth,
  };
};
