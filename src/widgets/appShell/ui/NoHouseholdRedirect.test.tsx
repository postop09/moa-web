import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockReplace = vi.fn();
const mockUseCurrentHousehold = vi.fn();
const mockRedirectIfNoHouseholds = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// useCurrentHousehold는 다른 슬라이스(features/household)이므로 공개 API(barrel)를 통해 import한다.
vi.mock('@/features/household', () => ({
  useCurrentHousehold: () => mockUseCurrentHousehold(),
}));

// redirectIfNoHouseholds도 다른 슬라이스(features/onboarding)이므로 공개 API(barrel)를 통해 import한다.
vi.mock('@/features/onboarding', () => ({
  redirectIfNoHouseholds: (...args: unknown[]) =>
    mockRedirectIfNoHouseholds(...args),
}));

import { NoHouseholdRedirect } from './NoHouseholdRedirect';

describe('NoHouseholdRedirect', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockUseCurrentHousehold.mockReset();
    mockRedirectIfNoHouseholds.mockReset();
  });

  it('항상 아무것도 렌더하지 않는다', () => {
    mockUseCurrentHousehold.mockReturnValue({
      households: [],
      isHouseholdsSuccess: false,
    });

    const { container } = render(<NoHouseholdRedirect />);

    expect(container).toBeEmptyDOMElement();
  });

  it('isHouseholdsSuccess가 false이면 redirectIfNoHouseholds를 호출하지 않는다', () => {
    mockUseCurrentHousehold.mockReturnValue({
      households: undefined,
      isHouseholdsSuccess: false,
    });

    render(<NoHouseholdRedirect />);

    expect(mockRedirectIfNoHouseholds).not.toHaveBeenCalled();
  });

  it('isHouseholdsSuccess가 true이면 households와 router로 redirectIfNoHouseholds를 호출한다', () => {
    const households = [{ id: 'household-1' }];
    mockUseCurrentHousehold.mockReturnValue({
      households,
      isHouseholdsSuccess: true,
    });

    render(<NoHouseholdRedirect />);

    expect(mockRedirectIfNoHouseholds).toHaveBeenCalledTimes(1);
    expect(mockRedirectIfNoHouseholds).toHaveBeenCalledWith(households, {
      replace: mockReplace,
    });
  });
});
