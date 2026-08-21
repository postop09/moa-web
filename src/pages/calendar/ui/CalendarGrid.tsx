'use client';

import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { CSSProperties } from 'react';

import type { Schedule } from '@/entities/schedule';
import { isSameDay, isSameMonth } from '@/shared/lib';

import { buildEventLanes } from '../model/buildEventLanes';
import { resolveScheduleColor } from '../model/resolveScheduleColor';
import { useCalendarSwipe } from '../model/useCalendarSwipe';
import { parseDayKey, toDayKey, WEEKDAY_LABELS } from '../model/visibleRange';
import styles from './calendar.module.css';

type Props = {
  month: Date;
  selectedDay: Date;
  days: Date[];
  showExpenses: boolean;
  expenseTotalByDayKey: Map<string, number>;
  schedules: Schedule[];
  authorColorById: Record<string, string>;
  categoryColorById: Record<number, string>;
  onSelectDay: (date: Date) => void;
  onSelectSchedule: (schedule: Schedule) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

const DAYS_PER_WEEK = 7;

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
  schedules,
  authorColorById,
  categoryColorById,
  onSelectDay,
  onSelectSchedule,
  onPrevMonth,
  onNextMonth,
}: Props) => {
  const today = new Date();
  const pendingDayRef = useRef<string | null>(null);
  const { swipeHandlers, hasSwiped } = useCalendarSwipe({
    onSwipeLeft: onNextMonth,
    onSwipeRight: onPrevMonth,
  });
  const weekLanes = useMemo(
    () => buildEventLanes(days, schedules),
    [days, schedules],
  );

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

  const handleSelectSchedule = (
    event: { stopPropagation: () => void },
    schedule: Schedule,
  ) => {
    event.stopPropagation();
    if (hasSwiped()) {
      return;
    }
    onSelectSchedule(schedule);
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
        {weekLanes.map((week, weekIndex) => {
          const weekDays = days.slice(
            weekIndex * DAYS_PER_WEEK,
            weekIndex * DAYS_PER_WEEK + DAYS_PER_WEEK,
          );
          const usedLanes = week.segments.reduce(
            (max, segment) => Math.max(max, segment.lane + 1),
            0,
          );

          return (
            <div className={styles.week} key={weekIndex}>
              <div className={styles.weekDays}>
                {weekDays.map((date, col) => {
                  const key = toDayKey(date);
                  const inMonth = isSameMonth(date, month);
                  const isToday = isSameDay(date, today);
                  const isSelected = isSameDay(date, selectedDay);
                  const expenseTotal = expenseTotalByDayKey.get(key) ?? 0;
                  const overflow = week.overflowByCol[col] ?? 0;

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
                      {overflow > 0 ? (
                        <span className={styles.dayOverflow}>+{overflow}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {usedLanes > 0 ? (
                <div className={styles.weekEvents}>
                  {Array.from({ length: usedLanes }, (_, lane) => (
                    <div className={styles.eventLane} key={lane}>
                      {week.segments
                        .filter((segment) => segment.lane === lane)
                        .map((segment) => (
                          <button
                            key={segment.schedule.id}
                            type="button"
                            className={[
                              styles.eventBar,
                              segment.isStart ? styles.eventBarStart : '',
                              segment.isEnd ? styles.eventBarEnd : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            style={
                              {
                                gridColumn: `${segment.startCol + 1} / ${segment.endCol + 2}`,
                                '--author-color': resolveScheduleColor(
                                  segment.schedule,
                                  categoryColorById,
                                  authorColorById,
                                ),
                              } as CSSProperties
                            }
                            onClick={(event) =>
                              handleSelectSchedule(event, segment.schedule)
                            }
                          >
                            {segment.isStart
                              ? segment.schedule.title
                              : '\u00a0'}
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
