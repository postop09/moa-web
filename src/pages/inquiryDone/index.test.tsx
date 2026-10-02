import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getInquiry } from '@/entities/inquiry';
import { useToast } from '@/shared/ui';

import { InquiryDonePage } from './index';

const SUPABASE = { __supabase: true };

const safeBack = vi.hoisted(() => ({
  goBack: vi.fn(),
  useSafeBack: vi.fn(),
}));

const router = {
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
};

vi.mock('next/navigation', () => ({ useRouter: () => router }));

vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSafeBack: safeBack.useSafeBack,
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createBrowserClient: () => SUPABASE,
}));

vi.mock('@/entities/inquiry', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getInquiry: vi.fn(),
}));

const makeInquiry = (category: string | null) => ({
  id: 'inq-1',
  userId: 'user-1',
  title: '제목',
  status: 'waiting',
  category,
  deviceInfo: null,
  hasUnreadReply: false,
  rating: null,
  waitingSince: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <InquiryDonePage inquiryId="inq-1" />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  safeBack.useSafeBack.mockImplementation(() => safeBack.goBack);
  act(() => useToast.setState({ message: null, tone: 'default' }));
  vi.mocked(getInquiry).mockResolvedValue(
    makeInquiry('account_login') as never,
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('InquiryDonePage', () => {
  it('불러오는 동안 aria-busy 스켈레톤을 보인다', () => {
    vi.mocked(getInquiry).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('inquiryId로 문의를 조회한다', async () => {
    renderPage();

    await screen.findByRole('heading', { name: '문의가 접수됐어요' });

    expect(getInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-1');
  });

  it('완료 안내 제목과 안내 문구 두 줄이 보인다', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: '문의가 접수됐어요' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('답변이 등록되면 내 문의에서 확인할 수 있어요'),
    ).toBeInTheDocument();
    expect(screen.getByText('평일 기준 1일 이내 답변해요')).toBeInTheDocument();
  });

  it('분류된 카테고리가 있으면 칩을 보여준다', async () => {
    renderPage();

    expect(
      await screen.findByText('계정·로그인 문의로 접수됐어요'),
    ).toBeInTheDocument();
  });

  it('카테고리가 null이면 칩이 없다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(makeInquiry(null) as never);
    renderPage();

    await screen.findByRole('heading', { name: '문의가 접수됐어요' });

    expect(screen.queryByText(/문의로 접수됐어요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/접수됨/)).not.toBeInTheDocument();
  });

  it('"내 문의 보기"를 누르면 router.replace 로 목록에 가서 완료 화면이 히스토리에 남지 않는다', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '문의가 접수됐어요' });

    fireEvent.click(screen.getByText('내 문의 보기'));

    expect(router.replace).toHaveBeenCalledWith('/support/inquiries');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('useSafeBack 의 fallback 은 /support 다', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '문의가 접수됐어요' });

    expect(safeBack.useSafeBack).toHaveBeenCalledWith('/support');
  });

  it('"확인"은 goBack 을 호출한다 (history.length 를 보지 않는다)', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '확인' }));

    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('"닫기"도 goBack 을 호출한다', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '닫기' }));

    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('불러오는 동안에도 제목(h1)이 이미 렌더돼 있다', () => {
    vi.mocked(getInquiry).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: '문의가 접수됐어요' }),
    ).toBeInTheDocument();
  });

  it('준비되면 포커스가 제목(h1, tabIndex -1)으로 이동한다', async () => {
    renderPage();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: '문의가 접수됐어요',
    });

    await waitFor(() => expect(heading).toHaveFocus());
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('조회가 실패해도 접수 완료 화면을 보여준다 (칩 없음, 이동 없음)', async () => {
    vi.mocked(getInquiry).mockRejectedValue(new Error('network'));
    renderPage();

    const heading = await screen.findByRole('heading', {
      name: '문의가 접수됐어요',
    });

    await waitFor(() => expect(heading).toHaveFocus());
    expect(
      screen.getByText('답변이 등록되면 내 문의에서 확인할 수 있어요'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/문의로 접수됐어요/)).not.toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('조회가 실패하면 한 번만 재시도한다 (총 2회 시도)', async () => {
    vi.mocked(getInquiry).mockRejectedValue(new Error('network'));
    renderPage();

    await waitFor(() => expect(getInquiry).toHaveBeenCalledTimes(2), {
      timeout: 4000,
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(getInquiry).toHaveBeenCalledTimes(2);
  }, 10000);

  it('문의를 찾을 수 없으면 /support/inquiries로 replace한다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(null);
    renderPage();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/support/inquiries'),
    );
    expect(useToast.getState().message).toBe(
      '문의가 접수되지 않았거나 삭제됐어요.',
    );
    expect(
      screen.queryByRole('heading', { name: '문의가 접수됐어요' }),
    ).not.toBeInTheDocument();
  });
});
