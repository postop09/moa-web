'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { Schedule } from '@/entities/schedule';
import type { Transaction } from '@/entities/transaction';
import { formatAmount } from '@/shared/lib';

import styles from './calendar.module.css';

type Props = {
  selectedDay: Date;
  showExpenses: boolean;
  schedules: Schedule[];
  expenses: Transaction[];
  creatorNameById: Record<string, string>;
  authorColorById: Record<string, string>;
  onAddSchedule: () => void;
  onSelectSchedule: (schedule: Schedule) => void;
};

const WEEKDAY_FULL = ['일', '월', '화', '수', '목', '금', '토'] as const;

const formatDayHeading = (date: Date) => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_FULL[date.getDay()]})`;
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const resolveExpenseName = (transaction: Transaction) => {
  return transaction.name?.trim() || '지출';
};

export const DayDetailPanel = ({
  selectedDay,
  showExpenses,
  schedules,
  expenses,
  creatorNameById,
  authorColorById,
  onAddSchedule,
  onSelectSchedule,
}: Props) => {
  const resolveCreatorName = (createdBy: string) => {
    return creatorNameById[createdBy] ?? '알 수 없음';
  };

  return (
    <section className={styles.detail} aria-label="선택한 날 상세">
      <header className={styles.detailHeader}>
        <h3 className={styles.detailTitle}>{formatDayHeading(selectedDay)}</h3>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onAddSchedule}
        >
          일정 추가
        </button>
      </header>

      <div className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>일정</h4>
        {schedules.length === 0 ? (
          <p className={styles.empty}>이 날의 일정이 없습니다.</p>
        ) : (
          <ul className={styles.detailList}>
            {schedules.map((schedule) => (
              <li key={schedule.id}>
                <button
                  type="button"
                  className={styles.scheduleItem}
                  style={
                    {
                      '--author-color':
                        authorColorById[schedule.createdBy] ??
                        'var(--color-accent)',
                    } as CSSProperties
                  }
                  onClick={() => onSelectSchedule(schedule)}
                >
                  <span className={styles.scheduleTime}>
                    {formatTime(schedule.startAt)}–{formatTime(schedule.endAt)}
                  </span>
                  <span className={styles.scheduleTitle}>{schedule.title}</span>
                  <span className={styles.scheduleAuthor}>
                    {resolveCreatorName(schedule.createdBy)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showExpenses ? (
        <div className={styles.detailSection}>
          <h4 className={styles.detailSectionTitle}>지출</h4>
          {expenses.length === 0 ? (
            <p className={styles.empty}>이 날의 지출이 없습니다.</p>
          ) : (
            <ul className={styles.detailList}>
              {expenses.map((transaction) => (
                <li key={transaction.id}>
                  <Link
                    href={`/write/${transaction.id}`}
                    className={styles.expenseItem}
                    style={
                      {
                        '--author-color':
                          authorColorById[transaction.createdBy] ??
                          'var(--color-expense)',
                      } as CSSProperties
                    }
                  >
                    <span className={styles.expenseName}>
                      {resolveExpenseName(transaction)}
                    </span>
                    <span className={styles.expenseAuthor}>
                      {resolveCreatorName(transaction.createdBy)}
                    </span>
                    <span className={styles.expenseAmount}>
                      -{formatAmount(transaction.amount)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
};
