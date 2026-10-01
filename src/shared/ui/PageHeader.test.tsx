import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('title을 페이지 제목(heading)으로 렌더한다', () => {
    render(<PageHeader title="고객센터" />);

    expect(
      screen.getByRole('heading', { name: '고객센터' }),
    ).toBeInTheDocument();
  });

  it('onBack이 있으면 "뒤로 가기" 버튼이 보이고 누르면 onBack이 호출된다', () => {
    const onBack = vi.fn();
    render(<PageHeader title="문의하기" onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('backHref가 있으면 "뒤로 가기" 링크가 해당 경로를 가리킨다', () => {
    render(<PageHeader title="내 문의 내역" backHref="/support" />);

    expect(screen.getByRole('link', { name: '뒤로 가기' })).toHaveAttribute(
      'href',
      '/support',
    );
  });

  it('onBack도 backHref도 없으면 뒤로 가기 컨트롤을 렌더하지 않는다', () => {
    render(<PageHeader title="고객센터" />);

    expect(
      screen.queryByRole('button', { name: '뒤로 가기' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '뒤로 가기' }),
    ).not.toBeInTheDocument();
  });

  it('right 슬롯의 내용을 렌더한다', () => {
    render(<PageHeader title="내 문의 내역" right={<button>편집</button>} />);

    expect(screen.getByRole('button', { name: '편집' })).toBeInTheDocument();
  });
});
