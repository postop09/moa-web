import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseHomeDashboard = vi.fn();

// useHomeDashboard는 같은 슬라이스(pages/home) 내부이므로
// 상대 경로(../model/useHomeDashboard)로 mock한다는 관례를 따른다.
vi.mock('../model/useHomeDashboard', () => ({
  useHomeDashboard: () => mockUseHomeDashboard(),
}));

import { DashboardSection } from './DashboardSection';

describe('DashboardSection', () => {
  beforeEach(() => {
    mockUseHomeDashboard.mockReset();
  });

  it('로딩 중이면 role="status"로 접근 가능한 로딩 문구를 보여준다', () => {
    mockUseHomeDashboard.mockReturnValue({
      isLoading: true,
      error: null,
    });

    render(
      <DashboardSection householdId="household-1" selectedMonth={new Date()} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…');
  });

  it('에러가 있으면 role="alert"로 접근 가능한 에러 문구를 보여준다', () => {
    mockUseHomeDashboard.mockReturnValue({
      isLoading: false,
      error: new Error('현황 조회 실패'),
    });

    render(
      <DashboardSection householdId="household-1" selectedMonth={new Date()} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('현황 조회 실패');
  });
});
