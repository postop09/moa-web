import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CardSkeleton,
  DashboardSkeleton,
  RingCardSkeleton,
} from './DashboardSkeleton';

// DashboardSkeleton과 하위 스켈레톤은 모두 "순수 장식"이다.
// 로딩 상태 안내(role="status", 문구)는 DashboardSection/HouseholdGuard의 상태 슬롯이 담당하므로
// 스켈레톤 자체는 접근성 트리에 아무것도 노출하지 않아야 한다.
describe('DashboardSkeleton', () => {
  it('루트가 aria-hidden="true"로 접근성 트리에서 숨겨진다', () => {
    const { container } = render(<DashboardSkeleton />);

    const root = container.firstElementChild;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('aria-hidden', 'true');
  });

  it('role="status"나 aria-label로 스스로 로딩 상태를 알리지 않는다', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveAttribute('role');
    expect(container.firstElementChild).not.toHaveAttribute('aria-label');
    expect(container.querySelector('[role]')).toBeNull();
  });

  it('텍스트 콘텐츠가 없다', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.textContent).toBe('');
    expect(screen.queryByText('불러오는 중…')).not.toBeInTheDocument();
    expect(screen.queryByText('현황을 불러오는 중')).not.toBeInTheDocument();
  });

  it('어떤 role도 접근성 트리에 노출하지 않는다', () => {
    render(<DashboardSkeleton />);

    expect(screen.queryAllByRole('status')).toHaveLength(0);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('region')).toHaveLength(0);
  });
});

describe('CardSkeleton', () => {
  it('루트가 aria-hidden="true"라 role="status"로 조회되지 않는다', () => {
    const { container } = render(<CardSkeleton />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('텍스트 콘텐츠가 없다', () => {
    const { container } = render(<CardSkeleton />);

    expect(container.textContent).toBe('');
  });

  it('height prop을 주어도 접근성 노출 없이 렌더된다', () => {
    const { container } = render(<CardSkeleton height="20rem" />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.textContent).toBe('');
  });
});

describe('RingCardSkeleton', () => {
  it('루트가 aria-hidden="true"로 접근성 트리에서 숨겨진다', () => {
    const { container } = render(<RingCardSkeleton />);

    const root = container.firstElementChild;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('텍스트 콘텐츠가 없다', () => {
    const { container } = render(<RingCardSkeleton />);

    expect(container.textContent).toBe('');
  });

  it('원형 자리 표시자(border-radius 50%)를 포함한다', () => {
    const { container } = render(<RingCardSkeleton />);

    const circles = Array.from(
      container.querySelectorAll<HTMLElement>('[aria-hidden="true"]'),
    ).filter((el) => el.style.borderRadius === '50%');
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });
});
