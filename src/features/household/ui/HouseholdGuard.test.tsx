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
