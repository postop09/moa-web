import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseHomeDashboard = vi.fn();

// useHomeDashboard는 같은 슬라이스(pages/home) 내부이므로
// 상대 경로(../model/useHomeDashboard)로 mock한다는 관례를 따른다.
vi.mock('../model/useHomeDashboard', () => ({
  useHomeDashboard: () => mockUseHomeDashboard(),
}));

// DashboardSection은 next/dynamic으로 ECharts 카드 5개를 지연 로드한다. jsdom에는
// canvas가 없어 ECharts 렌더가 불안정하므로 dynamic 컴포넌트를 빈 컴포넌트로 대체한다.
// 이 테스트가 검증하는 로딩/에러/갱신 문구는 카드 내용과 무관하다.
vi.mock('next/dynamic', () => ({
  default: () => {
    const Empty = () => null;
    return Empty;
  },
}));

import { DashboardSection } from './DashboardSection';

const UPDATING_MESSAGE = '이전 데이터 · 업데이트 중…';
const UPDATED_MESSAGE = '최신 정보로 업데이트되었습니다';
const ERROR_MESSAGE = '최신 정보를 가져오지 못했어요';

// 데이터가 있는(성공) 상태로 대시보드 본문을 렌더하기 위한 최소 필드 집합
const emptyDashboardData = {
  income: 0,
  expense: 0,
  saving: 0,
  insurance: 0,
  incomeTotalBudget: 0,
  expenseRate: null,
  insuranceRate: null,
  savingRate: null,
  expenseByCategory: [],
  categoryBudgets: [],
  recentTransactions: [],
  categories: [],
  monthlyExpenses: [],
  weeklyExpenses: [],
  dailyExpenses: [],
};

type StateOverrides = {
  hasData: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
  refetch?: ReturnType<typeof vi.fn>;
};

const makeDashboardState = ({
  hasData,
  isLoading = false,
  isFetching = false,
  error = null,
  refetch = vi.fn(async () => undefined),
}: StateOverrides) => ({
  ...emptyDashboardData,
  hasData,
  isLoading,
  isFetching,
  error,
  refetch,
});

const renderSection = () =>
  render(
    <DashboardSection householdId="household-1" selectedMonth={new Date()} />,
  );

describe('DashboardSection', () => {
  beforeEach(() => {
    mockUseHomeDashboard.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('데이터가 없을 때', () => {
    it('로딩 중이면 role="status" 슬롯에 "현황을 불러오는 중" 문구를 넣고 aria-busy를 켠다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: false,
          isLoading: true,
          isFetching: true,
        }),
      );

      renderSection();

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('현황을 불러오는 중');
      expect(screen.queryByText('불러오는 중…')).not.toBeInTheDocument();
      expect(screen.queryByText(/업데이트 중/)).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText(/잔액/)).not.toBeInTheDocument();

      const container = status.closest('[aria-busy]');
      expect(container).not.toBeNull();
      expect(container).toHaveAttribute('aria-busy', 'true');
    });

    it('로딩 중에는 장식용 스켈레톤(aria-hidden)이 상태 슬롯 아래에 함께 렌더된다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: false,
          isLoading: true,
          isFetching: true,
        }),
      );

      const { container } = renderSection();

      // 스켈레톤은 순수 장식이므로 role/status로 잡히지 않고 aria-hidden으로만 존재한다
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.queryAllByRole('status')).toHaveLength(1);
    });

    it('로딩 중에는 "다시 시도" 버튼을 보여주지 않는다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: false,
          isLoading: true,
          isFetching: true,
        }),
      );

      renderSection();

      expect(
        screen.queryByRole('button', { name: '다시 시도' }),
      ).not.toBeInTheDocument();
    });

    it('로딩 → 데이터 도착으로 바뀌어도 role="status" 노드는 교체되지 않고 동일하게 유지된다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: false,
          isLoading: true,
          isFetching: true,
        }),
      );

      const { rerender } = renderSection();
      const before = screen.getByRole('status');
      expect(before).toHaveTextContent('현황을 불러오는 중');

      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: true,
          isLoading: false,
          isFetching: false,
        }),
      );
      rerender(
        <DashboardSection
          householdId="household-1"
          selectedMonth={new Date()}
        />,
      );

      // 스크린 리더가 라이브 리전 변화를 계속 추적할 수 있도록 같은 DOM 노드여야 한다
      const after = screen.getByRole('status');
      expect(after).toBe(before);
      expect(screen.getByText(/잔액/)).toBeInTheDocument();
      expect(screen.queryByText('현황을 불러오는 중')).not.toBeInTheDocument();

      const container = after.closest('[aria-busy]');
      expect(container).toHaveAttribute('aria-busy', 'false');
    });

    it('에러가 있으면 role="alert"로 접근 가능한 에러 문구를 보여준다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: false,
          error: new Error('현황 조회 실패'),
        }),
      );

      renderSection();

      expect(screen.getByRole('alert')).toHaveTextContent('현황 조회 실패');
      expect(screen.queryByText(/잔액/)).not.toBeInTheDocument();
    });

    it('에러가 있어도 role="status" 슬롯은 유지되고 aria-busy는 꺼진다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: false,
          error: new Error('현황 조회 실패'),
        }),
      );

      renderSection();

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(ERROR_MESSAGE);
      expect(screen.queryByText('현황을 불러오는 중')).not.toBeInTheDocument();

      const container = status.closest('[aria-busy]');
      expect(container).not.toBeNull();
      expect(container).toHaveAttribute('aria-busy', 'false');
    });

    it('에러가 있으면 "다시 시도" 버튼을 보여주고 클릭 시 refetch를 1회 호출한다', () => {
      const refetch = vi.fn(async () => undefined);
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: false,
          error: new Error('현황 조회 실패'),
          refetch,
        }),
      );

      renderSection();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      const retryButton = screen.getByRole('button', { name: '다시 시도' });
      fireEvent.click(retryButton);

      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('데이터가 있을 때', () => {
    it('백그라운드 갱신 중이면 대시보드 본문과 함께 role="status"로 "업데이트 중" 문구를 보여주고 aria-busy를 켠다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({ hasData: true, isFetching: true }),
      );

      renderSection();

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(UPDATING_MESSAGE);
      // 전체 화면 로딩 문구로 대체되지 않고 대시보드 본문이 함께 보여야 한다
      expect(screen.queryByText('불러오는 중…')).not.toBeInTheDocument();
      expect(screen.getByText(/잔액/)).toBeInTheDocument();

      const container = status.closest('[aria-busy]');
      expect(container).not.toBeNull();
      expect(container).toHaveAttribute('aria-busy', 'true');
    });

    it('갱신 중이 아니고 에러도 없으면 상태 영역은 유지되되 비어 있고 aria-busy는 꺼진다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({ hasData: true, isFetching: false }),
      );

      renderSection();

      // 스크린 리더가 이후 메시지 변화를 안내할 수 있도록 상태 영역은 항상 마운트돼 있어야 한다
      const status = screen.getByRole('status');
      expect(status.textContent).toBe('');
      expect(screen.queryByText(/업데이트 중/)).not.toBeInTheDocument();
      expect(screen.getByText(/잔액/)).toBeInTheDocument();

      const container = status.closest('[aria-busy]');
      expect(container).not.toBeNull();
      expect(container).toHaveAttribute('aria-busy', 'false');
    });

    it('갱신이 끝나면(fetching→idle) 완료 문구를 보여주고 3초 뒤 비운다', () => {
      vi.useFakeTimers();

      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({ hasData: true, isFetching: true }),
      );

      const { rerender } = renderSection();
      expect(screen.getByRole('status')).toHaveTextContent(UPDATING_MESSAGE);

      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({ hasData: true, isFetching: false }),
      );
      rerender(
        <DashboardSection
          householdId="household-1"
          selectedMonth={new Date()}
        />,
      );

      expect(screen.getByRole('status')).toHaveTextContent(UPDATED_MESSAGE);
      expect(screen.getByText(/잔액/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByRole('status').textContent).toBe('');
    });

    it('에러가 있어도 이전 데이터 본문을 유지하고 role="alert" 대신 role="status"로 실패 문구를 보여준다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: true,
          isFetching: false,
          error: new Error('x'),
        }),
      );

      renderSection();

      expect(screen.getByRole('status')).toHaveTextContent(ERROR_MESSAGE);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText(/잔액/)).toBeInTheDocument();
      expect(screen.queryByText('불러오는 중…')).not.toBeInTheDocument();
    });

    it('에러가 있으면 "다시 시도" 버튼을 보여주고 클릭 시 refetch를 1회 호출한다', () => {
      const refetch = vi.fn(async () => undefined);
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: true,
          isFetching: false,
          error: new Error('x'),
          refetch,
        }),
      );

      renderSection();

      const retryButton = screen.getByRole('button', { name: '다시 시도' });
      fireEvent.click(retryButton);

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('에러가 없으면 "다시 시도" 버튼을 보여주지 않는다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({ hasData: true, isFetching: false }),
      );

      renderSection();

      expect(
        screen.queryByRole('button', { name: '다시 시도' }),
      ).not.toBeInTheDocument();
    });

    it('갱신 중이어도 에러가 있으면 실패 문구가 우선한다', () => {
      mockUseHomeDashboard.mockReturnValue(
        makeDashboardState({
          hasData: true,
          isFetching: true,
          error: new Error('x'),
        }),
      );

      renderSection();

      expect(screen.getByRole('status')).toHaveTextContent(ERROR_MESSAGE);
      expect(screen.queryByText(/업데이트 중/)).not.toBeInTheDocument();
    });
  });
});
