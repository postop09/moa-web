import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getVisibleCalendarDays } from '../model/visibleRange';
import { CalendarGrid } from './CalendarGrid';

describe('CalendarGrid', () => {
  it('42개의 날짜 셀을 grid 안에 렌더한다', () => {
    const month = new Date(2026, 9, 1);
    const days = getVisibleCalendarDays(month);

    render(
      <CalendarGrid
        month={month}
        selectedDay={month}
        days={days}
        showExpenses={false}
        expenseTotalByDayKey={new Map()}
        schedules={[]}
        authorColorById={{}}
        categoryColorById={{}}
        onSelectDay={vi.fn()}
        onSelectSchedule={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />,
    );

    const grid = screen.getByRole('grid');
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(42);
  });

  it('공휴일인 날의 셀에 접근 가능한 공휴일명 텍스트가 존재한다 (한글날)', () => {
    const month = new Date(2026, 9, 1);
    const days = getVisibleCalendarDays(month);

    render(
      <CalendarGrid
        month={month}
        selectedDay={month}
        days={days}
        showExpenses={false}
        expenseTotalByDayKey={new Map()}
        schedules={[]}
        authorColorById={{}}
        categoryColorById={{}}
        onSelectDay={vi.fn()}
        onSelectSchedule={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />,
    );

    expect(screen.getByText('한글날')).toBeInTheDocument();
  });
});
