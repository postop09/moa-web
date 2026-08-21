import type { CSSProperties } from 'react';

import { WELCOME_SECTION_IDS } from '../config/sections';
import styles from './welcome.module.css';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

type MockDay = {
  date: number;
  muted?: boolean;
  today?: boolean;
  expense?: string;
  event?: {
    label: string;
    color: string;
  };
};

const DAYS: MockDay[] = [
  { date: 26, muted: true },
  { date: 27, muted: true },
  { date: 28, muted: true },
  { date: 29, muted: true },
  { date: 30, muted: true },
  { date: 31, muted: true },
  { date: 1 },
  { date: 2 },
  { date: 3 },
  { date: 4 },
  { date: 5 },
  { date: 6 },
  { date: 7 },
  { date: 8, event: { label: '월급', color: '#16a34a' }, expense: '12만' },
  { date: 9 },
  { date: 10 },
  { date: 11 },
  { date: 12, expense: '4.2만' },
  { date: 13 },
  { date: 14 },
  { date: 15, event: { label: '여행', color: '#2563eb' } },
  { date: 16, event: { label: '여행', color: '#2563eb' } },
  { date: 17 },
  { date: 18, expense: '2.1만' },
  { date: 19 },
  { date: 20 },
  {
    date: 21,
    today: true,
    event: { label: '회의', color: '#7c3aed' },
    expense: '3.5만',
  },
  { date: 22 },
  { date: 23 },
  { date: 24 },
  { date: 25 },
  { date: 26 },
  { date: 27 },
  { date: 28 },
  { date: 29 },
  { date: 30 },
  { date: 31 },
  { date: 1, muted: true },
  { date: 2, muted: true },
  { date: 3, muted: true },
  { date: 4, muted: true },
  { date: 5, muted: true },
];

const FILTER_CHIPS = [
  { id: 'all', label: '전체', color: 'var(--color-accent)' },
  { id: 'me', label: '나', color: '#2563eb' },
  { id: 'partner', label: '파트너', color: '#db2777' },
  { id: 'work', label: '업무', color: '#7c3aed' },
] as const;

export const CalendarGuideSection = () => {
  return (
    <section
      id={WELCOME_SECTION_IDS.calendar}
      className={styles.section}
      aria-labelledby="calendar-guide-title"
    >
      <div className={styles.sectionInner}>
        <div className={styles.splitLayout}>
          <div className={styles.splitCopy}>
            <p className={styles.eyebrow}>달력</p>
            <h2 id="calendar-guide-title" className={styles.sectionTitle}>
              일정과 지출을 한눈에
            </h2>
            <p className={styles.sectionLead}>
              월 달력에서 일정을 깔고, 그날의 지출 합계까지 함께 봅니다. 좌우로
              밀면 월이 바뀌고, 카테고리·작성자로 걸러 볼 수 있습니다.
            </p>
            <div className={styles.filterChips} aria-hidden>
              {FILTER_CHIPS.map((chip) => (
                <span
                  key={chip.id}
                  className={styles.filterChip}
                  style={{ '--chip-color': chip.color } as CSSProperties}
                >
                  <span className={styles.filterChipDot} />
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.calendarMock} aria-hidden>
            <div className={styles.calendarToolbar}>2026년 8월</div>
            <div className={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className={styles.weekday}>
                  {label}
                </span>
              ))}
            </div>
            <div className={styles.calendarGrid}>
              {DAYS.map((day, index) => (
                <div
                  key={`${day.date}-${index}`}
                  className={`${styles.calDay} ${day.muted ? styles.calDayMuted : ''} ${
                    day.today ? styles.calDayToday : ''
                  }`}
                >
                  <span className={styles.calDate}>{day.date}</span>
                  {day.event ? (
                    <span
                      className={styles.calEvent}
                      style={{ background: day.event.color }}
                    >
                      {day.event.label}
                    </span>
                  ) : null}
                  {day.expense ? (
                    <span className={styles.calExpense}>{day.expense}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
