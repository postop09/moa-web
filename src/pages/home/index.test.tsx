import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseCurrentHousehold = vi.fn();

// features/household는 다른 슬라이스이므로 배럴(@/features/household)을 mock한다.
// HouseholdGuard는 fallback prop만 그대로 렌더해 "HomePage가 어떤 fallback을 넘기는지"만 검증한다.
// useCurrentHousehold는 HomePage가 직접 호출해 householdId 유무로 MonthNavigator를 제어하므로
// 케이스별로 반환값을 바꿀 수 있게 vi.fn으로 둔다.
vi.mock('@/features/household', () => ({
  HouseholdGuard: ({ fallback }: { fallback?: ReactNode }) => <>{fallback}</>,
  HouseholdPageTitle: () => null,
  useCurrentHousehold: () => mockUseCurrentHousehold(),
}));

// 같은 슬라이스 내부 의존은 상대 경로로 mock한다.
vi.mock('./ui/DashboardSection', () => ({
  DashboardSection: () => null,
}));

// 카드 청크 워밍은 네트워크/번들 관심사이므로 테스트에서는 무해화한다.
vi.mock('./ui/dashboardChunks', () => ({
  warmDashboardChunks: vi.fn(),
}));

// MonthNavigator는 실제 컴포넌트를 사용해 disabled 전파를 검증한다.
// useSelectedMonth만 최소 mock(canGoNext: true)으로 고정해 "다음 달" 버튼이 원래는 활성 상태가 되게 한다.
vi.mock('./model/useSelectedMonth', () => ({
  useSelectedMonth: () => ({
    selectedMonth: new Date(2026, 7, 1),
    canGoNext: true,
    goPrevMonth: () => {},
    goNextMonth: () => {},
  }),
}));

import { HomePage } from './index';

describe('HomePage', () => {
  beforeEach(() => {
    mockUseCurrentHousehold.mockReset();
  });

  describe('householdId가 아직 없을 때(가계부 로딩 중)', () => {
    beforeEach(() => {
      mockUseCurrentHousehold.mockReturnValue({
        householdId: null,
        isLoading: true,
        error: null,
      });
    });

    it('HouseholdGuard 로딩 fallback으로 장식용 대시보드 스켈레톤(aria-hidden)을 넘긴다', () => {
      const { container } = render(<HomePage />);

      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    it('MonthNavigator를 항상 렌더하되 이전/다음 버튼을 모두 비활성화한다', () => {
      render(<HomePage />);

      expect(screen.getByRole('button', { name: '이전 달' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '다음 달' })).toBeDisabled();
    });
  });

  describe('householdId가 있을 때', () => {
    beforeEach(() => {
      mockUseCurrentHousehold.mockReturnValue({
        householdId: 'h1',
        isLoading: false,
        error: null,
      });
    });

    it('MonthNavigator를 렌더하고 이전/다음 버튼이 활성 상태다(canGoNext: true 기준)', () => {
      render(<HomePage />);

      expect(screen.getByRole('button', { name: '이전 달' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '다음 달' })).toBeEnabled();
    });
  });
});
