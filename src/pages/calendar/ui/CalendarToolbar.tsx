'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
} from 'lucide-react';

import styles from './calendar.module.css';

type Props = {
  selectedMonth: Date;
  filterOpen: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onToggleFilter: () => void;
};

const formatMonthLabel = (date: Date) => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};

export const CalendarToolbar = ({
  selectedMonth,
  filterOpen,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  onToggleFilter,
}: Props) => {
  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={styles.filterButton}
        aria-expanded={filterOpen}
        aria-controls="calendar-sidebar"
        onClick={onToggleFilter}
      >
        <SlidersHorizontal size={16} aria-hidden />
      </button>
      <div className={styles.monthNavigator}>
        <button
          type="button"
          className={styles.monthNavButton}
          onClick={onPrevYear}
          aria-label="이전 해"
        >
          <ChevronsLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.monthNavButton}
          onClick={onPrevMonth}
          aria-label="이전 달"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <p className={styles.monthNavLabel} aria-live="polite">
          {formatMonthLabel(selectedMonth)}
        </p>
        <button
          type="button"
          className={styles.monthNavButton}
          onClick={onNextMonth}
          aria-label="다음 달"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
        <button
          type="button"
          className={styles.monthNavButton}
          onClick={onNextYear}
          aria-label="다음 해"
        >
          <ChevronsRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
};
