import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

// Skeleton은 순수 장식(placeholder) 요소다. 스크린 리더에는 노출되지 않아야 하고,
// width/height prop이 자리 잡기용 인라인 스타일로 반영되어야 한다.
describe('Skeleton', () => {
  it('aria-hidden="true"로 렌더되어 접근성 트리에서 숨겨진다', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstElementChild;
    expect(skeleton).not.toBeNull();
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('width/height prop이 인라인 스타일에 반영된다', () => {
    const { container } = render(<Skeleton width="4rem" height="1rem" />);

    // jsdom이 getComputedStyle에서 rem을 px로 환산하므로 toHaveStyle 대신
    // 인라인 style 속성 값을 직접 비교한다.
    const skeleton = container.firstElementChild as HTMLElement;
    expect(skeleton.style.width).toBe('4rem');
    expect(skeleton.style.height).toBe('1rem');
  });

  it('width/height를 주지 않으면 인라인 width/height를 강제하지 않는다', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstElementChild as HTMLElement;
    expect(skeleton.style.width).toBe('');
    expect(skeleton.style.height).toBe('');
  });

  it('텍스트 노드가 없고 role도 없어 접근성 트리에 아무것도 노출하지 않는다', () => {
    const { container, queryAllByRole } = render(<Skeleton />);

    expect(container.textContent).toBe('');
    expect(container.firstElementChild).not.toHaveAttribute('role');
    // aria-hidden 요소는 어떤 role 쿼리에도 잡히지 않아야 한다
    expect(queryAllByRole('status')).toHaveLength(0);
    expect(queryAllByRole('img')).toHaveLength(0);
  });

  it('className prop을 추가 클래스로 합친다', () => {
    const { container } = render(<Skeleton className="custom" />);

    expect(container.firstElementChild).toHaveClass('custom');
  });

  describe('circle prop', () => {
    it('circle이면 인라인 border-radius가 50%로 렌더되어 원형 자리 표시자가 된다', () => {
      const { container } = render(
        <Skeleton circle width="4.5rem" height="4.5rem" />,
      );

      const skeleton = container.firstElementChild as HTMLElement;
      expect(skeleton.style.borderRadius).toBe('50%');
      // circle이어도 width/height는 그대로 유지된다
      expect(skeleton.style.width).toBe('4.5rem');
      expect(skeleton.style.height).toBe('4.5rem');
    });

    it('circle을 주지 않으면 인라인 border-radius를 강제하지 않는다', () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstElementChild as HTMLElement;
      expect(skeleton.style.borderRadius).toBe('');
    });

    it('circle이어도 aria-hidden="true"로 접근성 트리에서 숨겨진다', () => {
      const { container } = render(<Skeleton circle />);

      expect(container.firstElementChild).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });
  });
});
