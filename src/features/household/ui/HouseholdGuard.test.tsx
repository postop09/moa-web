import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseCurrentHousehold = vi.fn();

// useCurrentHousehold는 같은 슬라이스(features/household) 내부이므로
// 상대 경로(../model/useCurrentHousehold)로 mock한다는 관례를 따른다.
vi.mock('../model/useCurrentHousehold', () => ({
  useCurrentHousehold: () => mockUseCurrentHousehold(),
}));

import { HouseholdGuard } from './HouseholdGuard';

describe('HouseholdGuard', () => {
  beforeEach(() => {
    mockUseCurrentHousehold.mockReset();
  });

  it('로딩 중이면 role="status"로 접근 가능한 로딩 문구를 보여준다', () => {
    mockUseCurrentHousehold.mockReturnValue({
      householdId: null,
      isLoading: true,
      error: null,
    });

    render(<HouseholdGuard>{() => <div>content</div>}</HouseholdGuard>);

    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…');
  });

  describe('fallback prop', () => {
    it('로딩 중이고 fallback이 있으면 role="status" 컨테이너 안에 fallback을 렌더하고 children은 렌더하지 않는다', () => {
      mockUseCurrentHousehold.mockReturnValue({
        householdId: null,
        isLoading: true,
        error: null,
      });

      render(
        <HouseholdGuard fallback={<div data-testid="fb" />}>
          {() => <div>content</div>}
        </HouseholdGuard>,
      );

      const status = screen.getByRole('status');
      expect(status).toContainElement(screen.getByTestId('fb'));
      expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('로딩 중이고 fallback이 있으면 스크린 리더용 "불러오는 중…" 문구가 status 안에 함께 들어간다', () => {
      mockUseCurrentHousehold.mockReturnValue({
        householdId: null,
        isLoading: true,
        error: null,
      });

      render(
        <HouseholdGuard fallback={<div data-testid="fb" />}>
          {() => <div>content</div>}
        </HouseholdGuard>,
      );

      const status = screen.getByRole('status');
      // 시각적으로는 숨겨지지만(srOnly) DOM에는 존재해 status 리전의 텍스트로 읽힌다
      const srText = screen.getByText('불러오는 중…');
      expect(status).toContainElement(srText);
      expect(status).toHaveTextContent('불러오는 중…');
    });

    it('로딩 중 fallback 상태에서 role="status"는 하나만 존재한다', () => {
      mockUseCurrentHousehold.mockReturnValue({
        householdId: null,
        isLoading: true,
        error: null,
      });

      render(
        <HouseholdGuard fallback={<div data-testid="fb" aria-hidden="true" />}>
          {() => <div>content</div>}
        </HouseholdGuard>,
      );

      expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('로딩이 끝나고 householdId가 있으면 fallback을 렌더하지 않고 children을 렌더한다', () => {
      mockUseCurrentHousehold.mockReturnValue({
        householdId: 'household-1',
        isLoading: false,
        error: null,
      });

      render(
        <HouseholdGuard fallback={<div data-testid="fb">skeleton</div>}>
          {(householdId) => <div>household: {householdId}</div>}
        </HouseholdGuard>,
      );

      expect(screen.queryByTestId('fb')).not.toBeInTheDocument();
      expect(screen.getByText('household: household-1')).toBeInTheDocument();
    });

    it('에러 상태에서는 fallback이 아니라 role="alert" 에러 문구를 렌더한다', () => {
      mockUseCurrentHousehold.mockReturnValue({
        householdId: null,
        isLoading: false,
        error: new Error('가계부 조회 실패'),
      });

      render(
        <HouseholdGuard fallback={<div data-testid="fb">skeleton</div>}>
          {() => <div>content</div>}
        </HouseholdGuard>,
      );

      expect(screen.queryByTestId('fb')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('가계부 조회 실패');
    });
  });

  it('에러가 있으면 role="alert"로 접근 가능한 에러 문구를 보여준다', () => {
    mockUseCurrentHousehold.mockReturnValue({
      householdId: null,
      isLoading: false,
      error: new Error('가계부 조회 실패'),
    });

    render(<HouseholdGuard>{() => <div>content</div>}</HouseholdGuard>);

    expect(screen.getByRole('alert')).toHaveTextContent('가계부 조회 실패');
  });

  it('정상 상태이면 children(householdId)을 렌더한다', () => {
    mockUseCurrentHousehold.mockReturnValue({
      householdId: 'household-1',
      isLoading: false,
      error: null,
    });

    render(
      <HouseholdGuard>
        {(householdId) => <div>household: {householdId}</div>}
      </HouseholdGuard>,
    );

    expect(screen.getByText('household: household-1')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
