'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { CSSProperties } from 'react';

import type { AuthorFilter, AuthorOption } from '../model/useCalendarPage';
import styles from './calendar.module.css';

type Props = {
  selectedMonth: Date;
  showExpenses: boolean;
  authorFilter: AuthorFilter;
  authorOptions: AuthorOption[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onToggleExpenses: (value: boolean) => void;
  onAuthorFilterChange: (value: AuthorFilter) => void;
};

const formatMonthLabel = (date: Date) => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};

export const CalendarToolbar = ({
  selectedMonth,
  showExpenses,
  authorFilter,
  authorOptions,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  onToggleExpenses,
  onAuthorFilterChange,
}: Props) => {
  return (
    <div className={styles.toolbar}>
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

      <label className={styles.toggleRow}>
        <span className={styles.toggleLabel}>지출 표시</span>
        <input
          className={styles.visuallyHidden}
          type="checkbox"
          role="switch"
          checked={showExpenses}
          aria-checked={showExpenses}
          onChange={(event) => onToggleExpenses(event.target.checked)}
        />
        <span className={styles.switchTrack} aria-hidden>
          <span className={styles.switchThumb} />
        </span>
      </label>

      <div className={styles.authorGroup} role="group" aria-label="작성자 필터">
        <button
          type="button"
          className={`${styles.authorChip} ${authorFilter === 'all' ? styles.authorChipActive : ''}`}
          onClick={() => onAuthorFilterChange('all')}
        >
          전체
        </button>
        {authorOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`${styles.authorChip} ${authorFilter === option.id ? styles.authorChipActive : ''}`}
            style={{ '--author-color': option.color } as CSSProperties}
            onClick={() => onAuthorFilterChange(option.id)}
          >
            <span
              className={styles.authorDot}
              style={{ background: option.color }}
              aria-hidden
            />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
