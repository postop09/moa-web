'use client';

import { useState } from 'react';

import { startOfMonth, shiftMonth, isSameMonth } from '@/shared/lib';

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
