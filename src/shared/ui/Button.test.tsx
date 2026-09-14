import Link from 'next/link';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  describe('variant', () => {
    it.each([
      ['primary', '기본 버튼'],
      ['secondary', '보조 버튼'],
      ['danger', '위험 버튼'],
      ['dangerText', '위험 텍스트 버튼'],
      ['text', '텍스트 버튼'],
    ] as const)(
      'variant="%s"이면 접근 가능한 이름으로 버튼이 렌더된다',
      (variant, label) => {
        render(<Button variant={variant}>{label}</Button>);

        expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
      },
    );

    it('variant를 지정하지 않으면 기본값(primary)으로 렌더된다', () => {
      render(<Button>기본값 버튼</Button>);

      expect(
        screen.getByRole('button', { name: '기본값 버튼' }),
      ).toBeInTheDocument();
    });
  });

  describe('loading 상태', () => {
    it('loading=true이면 button이 disabled 상태다', () => {
      render(<Button loading>저장</Button>);

      expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });

    it('loading=true이면 aria-busy="true"가 설정된다', () => {
      render(<Button loading>저장</Button>);

      expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute(
        'aria-busy',
        'true',
      );
    });

    it('loading=true이고 loadingLabel을 주면 children 대신 loadingLabel이 보인다', () => {
      render(
        <Button loading loadingLabel="저장 중…">
          저장
        </Button>,
      );

      expect(
        screen.getByRole('button', { name: '저장 중…' }),
      ).toBeInTheDocument();
      expect(screen.queryByText('저장')).not.toBeInTheDocument();
    });

    it('loading=true이고 loadingLabel이 없으면 원래 children 텍스트가 그대로 보인다', () => {
      render(<Button loading>저장</Button>);

      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    });

    it('loading=false(기본값)면 disabled가 아니고 aria-busy도 true가 아니다', () => {
      render(<Button>저장</Button>);

      const button = screen.getByRole('button', { name: '저장' });
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('disabled prop', () => {
    it('loading과 무관하게 disabled=true를 직접 주면 버튼이 비활성화된다', () => {
      render(<Button disabled>저장</Button>);

      expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });
  });

  describe('as="a"', () => {
    it('href와 함께 쓰면 a 엘리먼트(role="link")로 렌더된다', () => {
      render(
        <Button as="a" href="/guide">
          가이드 보기
        </Button>,
      );

      const link = screen.getByRole('link', { name: '가이드 보기' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/guide');
    });

    it('loading=true이면 aria-disabled="true"가 설정된다', () => {
      render(
        <Button as="a" href="/guide" loading>
          가이드 보기
        </Button>,
      );

      expect(screen.getByRole('link', { name: '가이드 보기' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('disabled=true이면 aria-disabled="true"가 설정된다', () => {
      render(
        <Button as="a" href="/guide" disabled>
          가이드 보기
        </Button>,
      );

      expect(screen.getByRole('link', { name: '가이드 보기' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('disabled/loading이 모두 false이면 aria-disabled가 없거나 "false"다', () => {
      render(
        <Button as="a" href="/guide">
          가이드 보기
        </Button>,
      );

      const link = screen.getByRole('link', { name: '가이드 보기' });
      const ariaDisabled = link.getAttribute('aria-disabled');
      expect(ariaDisabled === null || ariaDisabled === 'false').toBe(true);
    });
  });

  describe('as={Link} (next/link)', () => {
    it('next/link의 a 엘리먼트(role="link")로 렌더된다', () => {
      render(
        <Button as={Link} href="/guide">
          가이드로 이동
        </Button>,
      );

      const link = screen.getByRole('link', { name: '가이드로 이동' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/guide');
    });
  });

  describe('fullWidth', () => {
    it('fullWidth=true여도 정상적으로 렌더된다(스모크)', () => {
      render(<Button fullWidth>전체 너비 버튼</Button>);

      expect(
        screen.getByRole('button', { name: '전체 너비 버튼' }),
      ).toBeInTheDocument();
    });
  });

  describe('표준 props 전달', () => {
    it('onClick 핸들러가 클릭 시 호출된다', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>클릭</Button>);

      fireEvent.click(screen.getByRole('button', { name: '클릭' }));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('loading=true이면 disabled라 클릭해도 onClick이 호출되지 않는다', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          클릭
        </Button>,
      );

      fireEvent.click(screen.getByRole('button', { name: '클릭' }));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('type="submit"이 그대로 전달된다', () => {
      render(<Button type="submit">제출</Button>);

      expect(screen.getByRole('button', { name: '제출' })).toHaveAttribute(
        'type',
        'submit',
      );
    });

    it('aria-label을 전달하면 접근 가능한 이름으로 사용된다', () => {
      render(<Button aria-label="닫기">×</Button>);

      expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    });
  });

  describe('children 렌더', () => {
    it('아이콘과 텍스트를 함께 넣어도 그대로 렌더된다', () => {
      render(
        <Button>
          <svg aria-hidden="true" data-testid="icon" />
          저장하기
        </Button>,
      );

      expect(
        screen.getByRole('button', { name: '저장하기' }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });
});
