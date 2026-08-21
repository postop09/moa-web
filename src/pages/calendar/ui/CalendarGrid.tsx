'use client';

import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

import type { Schedule } from '@/entities/schedule';
import { isSameDay, isSameMonth } from '@/shared/lib';

import { useCalendarSwipe } from '../model/useCalendarSwipe';
import { parseDayKey, toDayKey, WEEKDAY_LABELS } from '../model/visibleRange';
import styles from './calendar.module.css';

type Props = {
  month: Date;
  selectedDay: Date;
  days: Date[];
  showExpenses: boolean;
  expenseTotalByDayKey: Map<string, number>;
  schedulesByDayKey: Map<string, Schedule[]>;
  authorColorById: Record<string, string>;
  onSelectDay: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
};

const MAX_DOTS = 3;

const formatCompactAmount = (amount: number) => {
  if (amount >= 100_000) {
    return `${Math.round(amount / 10_000)}만`;
  }
  return amount.toLocaleString('ko-KR');
};

export const CalendarGrid = ({
  month,
  selectedDay,
  days,
  showExpenses,
  expenseTotalByDayKey,
  schedulesByDayKey,
  authorColorById,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
}: Props) => {
  const today = new Date();
  const pendingDayRef = useRef<string | null>(null);
  const { swipeHandlers, hasSwiped } = useCalendarSwipe({
    onSwipeLeft: onNextMonth,
    onSwipeRight: onPrevMonth,
    onSwipeUp: onNextYear,
    onSwipeDown: onPrevYear,
  });

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const dayEl = (event.target as HTMLElement).closest('[data-day]');
    pendingDayRef.current = dayEl?.getAttribute('data-day') ?? null;
    swipeHandlers.onPointerDown(event);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    pendingDayRef.current = null;
    swipeHandlers.onPointerCancel(event);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    swipeHandlers.onPointerUp(event);
    const key = pendingDayRef.current;
    pendingDayRef.current = null;

    if (hasSwiped() || !key) {
      return;
    }

    const date = parseDayKey(key);
    if (date) {
      onSelectDay(date);
    }
  };

  const handleSelectDay = (date: Date) => {
    if (hasSwiped()) {
      return;
    }

    onSelectDay(date);
  };

  return (
    <div
      className={styles.gridWrap}
      onPointerDown={handlePointerDown}
      onPointerMove={swipeHandlers.onPointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className={styles.weekdayRow} aria-hidden>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={styles.weekday}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.grid} role="grid" aria-label="달력">
        {days.map((date) => {
          const key = toDayKey(date);
          const inMonth = isSameMonth(date, month);
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDay);
          const expenseTotal = expenseTotalByDayKey.get(key) ?? 0;
          const schedules = schedulesByDayKey.get(key) ?? [];
          const dots = schedules
            .map((schedule) => authorColorById[schedule.createdBy])
            .filter(
              (color, index, list) => color && list.indexOf(color) === index,
            )
            .slice(0, MAX_DOTS);

          const className = [
            styles.dayCell,
            inMonth ? '' : styles.dayCellMuted,
            isToday ? styles.dayCellToday : '',
            isSelected ? styles.dayCellSelected : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              className={className}
              aria-selected={isSelected}
              aria-current={isToday ? 'date' : undefined}
              data-day={key}
              onClick={() => handleSelectDay(date)}
            >
              <span className={styles.dayNumber}>{date.getDate()}</span>
              {showExpenses && expenseTotal > 0 ? (
                <span className={styles.dayExpense}>
                  {formatCompactAmount(expenseTotal)}
                </span>
              ) : null}
              {dots.length > 0 ? (
                <span className={styles.dayDots}>
                  {dots.map((color) => (
                    <span
                      key={color}
                      className={styles.dayDot}
                      style={{ background: color }}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
