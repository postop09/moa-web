import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DayDetailPanel } from './DayDetailPanel';

const baseProps = {
  showExpenses: false,
  schedules: [],
  expenses: [],
  creatorNameById: {},
  authorColorById: {},
  categoryColorById: {},
  expenseCategoryNameById: {},
  onAddSchedule: vi.fn(),
  onSelectSchedule: vi.fn(),
};

describe('DayDetailPanel', () => {
  it('공휴일인 날은 헤딩에 날짜와 공휴일명을 함께 보여준다 (한글날)', () => {
    render(
      <DayDetailPanel {...baseProps} selectedDay={new Date(2026, 9, 9)} />,
    );

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('2026년 10월 9일 (금)');
    expect(heading).toHaveTextContent('한글날');
  });

  it('공휴일 명칭이 여러 개인 날은 모두 보여준다 (어린이날 + 부처님 오신 날)', () => {
    render(
      <DayDetailPanel {...baseProps} selectedDay={new Date(2025, 4, 5)} />,
    );

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('어린이날');
    expect(heading).toHaveTextContent('부처님 오신 날');
  });

  it('공휴일이 아닌 날은 구분자 없이 날짜만 보여준다', () => {
    render(
      <DayDetailPanel {...baseProps} selectedDay={new Date(2026, 9, 10)} />,
    );

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('2026년 10월 10일 (토)');
    expect(heading.textContent).not.toContain(' · ');
  });
});
