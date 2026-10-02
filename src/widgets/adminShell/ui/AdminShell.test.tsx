import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { siteName } from '@/shared/config';

import { AdminShell } from './AdminShell';

const nav = vi.hoisted(() => ({ pathname: '/admin/inquiries' }));
const pending = vi.hoisted(() => ({ data: undefined as number | undefined }));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/features/adminInquiry', () => ({
  useAdminPendingCount: () => ({ data: pending.data }),
}));

const renderShell = () =>
  render(
    <AdminShell>
      <h1>본문 제목</h1>
    </AdminShell>,
  );

const menu = () => screen.getByRole('navigation', { name: '어드민 메뉴' });

beforeEach(() => {
  nav.pathname = '/admin/inquiries';
  pending.data = undefined;
});

describe('AdminShell', () => {
  it('브랜드 텍스트에 사이트 이름과 "어드민" 이 있다', () => {
    renderShell();

    expect(screen.getByText(`${siteName} 어드민`)).toBeInTheDocument();
  });

  it('children 은 main 랜드마크 안에 그려진다', () => {
    renderShell();

    expect(
      within(screen.getByRole('main')).getByRole('heading', {
        name: '본문 제목',
      }),
    ).toBeInTheDocument();
  });

  it('사용자 앱의 탭바/주요 메뉴 내비게이션은 없다', () => {
    renderShell();

    expect(
      screen.queryByRole('navigation', { name: '주요 메뉴' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });

  describe('문의 관리 링크', () => {
    it('/admin/inquiries 로 가는 링크다', () => {
      renderShell();

      expect(
        within(menu()).getByRole('link', { name: /^문의 관리/ }),
      ).toHaveAttribute('href', '/admin/inquiries');
    });

    it.each(['/admin/inquiries', '/admin/inquiries/abc-123'])(
      '%s 에서는 aria-current="page"',
      (pathname) => {
        nav.pathname = pathname;
        renderShell();

        expect(
          within(menu()).getByRole('link', { name: /^문의 관리/ }),
        ).toHaveAttribute('aria-current', 'page');
      },
    );

    it('다른 경로에서는 aria-current 가 없다', () => {
      nav.pathname = '/admin';
      renderShell();

      expect(
        within(menu()).getByRole('link', { name: /^문의 관리/ }),
      ).not.toHaveAttribute('aria-current');
    });
  });

  describe('미처리 건수 배지', () => {
    it('건수가 있으면 보이고 접근 가능한 이름에 건수가 들어간다', () => {
      pending.data = 12;
      renderShell();

      expect(
        within(menu()).getByRole('link', { name: '문의 관리, 미처리 12건' }),
      ).toBeInTheDocument();
      expect(within(menu()).getByText('12')).toBeVisible();
    });

    it.each([0, undefined])(
      '건수가 %s 이면 배지도 이름의 건수도 없다',
      (value) => {
        pending.data = value;
        renderShell();

        const link = within(menu()).getByRole('link', { name: /^문의 관리/ });

        expect(link).toHaveAccessibleName('문의 관리');
        expect(within(link).queryByText('0')).not.toBeInTheDocument();
      },
    );
  });

  describe('2차 범위 메뉴', () => {
    it.each(['FAQ 관리', '답변 템플릿', '통계'])(
      '%s 는 링크가 아니라 aria-disabled="true" 항목이다',
      (label) => {
        renderShell();

        expect(
          within(menu()).queryByRole('link', { name: new RegExp(label) }),
        ).not.toBeInTheDocument();

        const item = within(menu())
          .getByText(label)
          .closest('[aria-disabled="true"]');

        expect(item).not.toBeNull();
        expect(item?.closest('a')).toBeNull();
      },
    );

    it('세 항목 모두 눈에 보이는 "준비 중" 안내가 있다', () => {
      renderShell();

      const hints = within(menu()).getAllByText('준비 중');

      expect(hints).toHaveLength(3);
      hints.forEach((hint) => expect(hint).toBeVisible());
    });

    it('내비게이션 안의 링크는 문의 관리 하나뿐이다', () => {
      renderShell();

      expect(within(menu()).getAllByRole('link')).toHaveLength(1);
    });
  });
});
