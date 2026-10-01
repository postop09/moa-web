import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedUser } from '@/entities/auth';
import { getMyInquiries } from '@/entities/inquiry';

import { MyInquiriesPage } from './index';

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

vi.mock('@/entities/auth', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getCachedUser: vi.fn(),
}));

vi.mock('@/entities/inquiry', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getMyInquiries: vi.fn(),
}));

type Status = 'waiting' | 'in_progress' | 'answered' | 'closed';

const makeInquiry = (
  id: string,
  overrides: Partial<{
    title: string;
    status: Status;
    category: string | null;
    hasUnreadReply: boolean;
    createdAt: string;
  }> = {},
) => ({
  id,
  userId: 'user-1',
  title: `제목 ${id}`,
  status: 'waiting' as Status,
  category: 'account_login',
  deviceInfo: null,
  hasUnreadReply: false,
  rating: null,
  waitingSince: '2026-10-01T00:00:00Z',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  ...overrides,
});

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  disconnected = false;
  observe = vi.fn();
  unobserve = vi.fn();
  takeRecords = () => [];
  callback: IntersectionObserverCallback;

  // 브라우저 API 를 흉내 내려면 new 가능한 클래스가 필요해 화살표 규칙에서 예외로 둔다.
  // eslint-disable-next-line no-restricted-syntax
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  // eslint-disable-next-line no-restricted-syntax
  disconnect() {
    this.disconnected = true;
  }
}

const stubObserver = () => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
};

const intersect = (isIntersecting = true) =>
  act(() => {
    FakeIntersectionObserver.instances
      .filter((observer) => !observer.disconnected)
      .forEach((observer) =>
        observer.callback(
          [{ isIntersecting } as IntersectionObserverEntry],
          observer as unknown as IntersectionObserver,
        ),
      );
  });

const renderPage = (
  status: 'all' | 'waiting' | 'answered' | 'closed' = 'all',
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ui = (s: typeof status) => (
    <QueryClientProvider client={client}>
      <MyInquiriesPage status={s} />
    </QueryClientProvider>
  );
  const result = render(ui(status));
  return {
    ...result,
    client,
    rerenderWith: (s: typeof status) => result.rerender(ui(s)),
  };
};

const statusText = () =>
  screen
    .getAllByRole('status')
    .map((element) => element.textContent)
    .join(' ');

const waitForIdle = (client: { isFetching: () => number }) =>
  waitFor(() => expect(client.isFetching()).toBe(0));

const pagesCalled = (page: number) =>
  vi
    .mocked(getMyInquiries)
    .mock.calls.filter(([, req]) => (req as { page: number }).page === page);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMyInquiries).mockReset();
  safeBack.useSafeBack.mockImplementation(() => safeBack.goBack);
  vi.mocked(getCachedUser).mockResolvedValue({ id: 'user-1' } as never);
  vi.mocked(getMyInquiries).mockResolvedValue({
    items: [makeInquiry('a')],
    nextPage: null,
  } as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MyInquiriesPage', () => {
  describe('헤더와 탭', () => {
    it('제목 "내 문의" 헤더가 보이고 뒤로 가기는 useSafeBack("/support") 의 goBack 이다', async () => {
      renderPage();

      expect(
        screen.getByRole('heading', { name: '내 문의' }),
      ).toBeInTheDocument();
      expect(safeBack.useSafeBack).toHaveBeenCalledWith('/support');

      fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

      expect(safeBack.goBack).toHaveBeenCalledTimes(1);
      await screen.findByText('제목 a');
    });

    it('전체/답변 대기/답변 완료/종결 탭이 tablist 안에 있고 현재 status 탭만 선택돼 있다', async () => {
      renderPage('answered');

      const tablist = screen.getByRole('tablist');
      const tabs = within(tablist).getAllByRole('tab');

      expect(tabs.map((tab) => tab.textContent)).toEqual([
        '전체',
        '답변 대기',
        '답변 완료',
        '종결',
      ]);
      expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual([
        'false',
        'false',
        'true',
        'false',
      ]);
      await screen.findByText('제목 a');
    });

    it('선택된 탭만 탭 순서에 들어간다 (roving tabindex)', async () => {
      renderPage('waiting');

      const tabs = screen.getAllByRole('tab');

      expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1, -1]);
      await screen.findByText('제목 a');
    });

    it('화살표 키는 다음 탭으로 포커스만 옮기고 URL 은 바꾸지 않는다', async () => {
      renderPage('all');
      await screen.findByText('제목 a');
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();

      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });

      expect(tabs[1]).toHaveFocus();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('탭을 누르면 router.replace 로 ?status= 를 바꾸고 스크롤을 유지한다', async () => {
      renderPage('all');
      await screen.findByText('제목 a');

      fireEvent.click(screen.getByRole('tab', { name: '답변 완료' }));

      expect(router.replace).toHaveBeenCalledWith(
        '/support/inquiries?status=answered',
        { scroll: false },
      );
      expect(router.push).not.toHaveBeenCalled();
    });

    it('"전체" 로 돌아가면 status 쿼리를 all 로 두거나 생략한 URL 로 replace 한다', async () => {
      renderPage('closed');
      await screen.findByText('제목 a');

      fireEvent.click(screen.getByRole('tab', { name: '전체' }));

      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(/^\/support\/inquiries(\?status=all)?$/),
        { scroll: false },
      );
    });

    it('status prop 으로 해당 상태 필터를 걸어 조회한다', async () => {
      renderPage('waiting');

      await screen.findByText('제목 a');

      expect(getMyInquiries).toHaveBeenCalledWith(SUPABASE, {
        userId: 'user-1',
        page: 0,
        status: 'waiting',
      });
    });
  });

  describe('카드', () => {
    it('카드는 상세 링크이며 상태 뱃지·제목·"카테고리 · MM.DD" 를 보여준다', async () => {
      vi.mocked(getMyInquiries).mockResolvedValue({
        items: [
          makeInquiry('a', {
            title: '동기화 후 내역이 사라졌어요',
            status: 'answered',
            category: 'account_login',
            createdAt: '2026-10-01T00:00:00Z',
          }),
        ],
        nextPage: null,
      } as never);
      renderPage();

      const card = await screen.findByRole('link', {
        name: /동기화 후 내역이 사라졌어요/,
      });

      expect(card).toHaveAttribute('href', '/support/inquiries/a');
      expect(within(card).getByText('답변 완료')).toBeInTheDocument();
      expect(within(card).getByText('계정·로그인 · 10.01')).toBeInTheDocument();
    });

    it('미분류 문의는 카테고리 자리에 "접수됨" 을 보여준다', async () => {
      vi.mocked(getMyInquiries).mockResolvedValue({
        items: [makeInquiry('a', { category: null })],
        nextPage: null,
      } as never);
      renderPage();

      const card = await screen.findByRole('link', { name: /제목 a/ });

      expect(within(card).getByText('접수됨 · 10.01')).toBeInTheDocument();
    });

    it('in_progress 는 사용자에게 "답변 대기" 로 보인다', async () => {
      vi.mocked(getMyInquiries).mockResolvedValue({
        items: [makeInquiry('a', { status: 'in_progress' })],
        nextPage: null,
      } as never);
      renderPage();

      const card = await screen.findByRole('link', { name: /제목 a/ });

      expect(within(card).getByText('답변 대기')).toBeInTheDocument();
      expect(within(card).queryByText('처리 중')).not.toBeInTheDocument();
    });

    it('미확인 답변이 있는 카드만 강조(data-unread)되고 "새 답변" 텍스트를 보인다', async () => {
      vi.mocked(getMyInquiries).mockResolvedValue({
        items: [
          makeInquiry('a', { hasUnreadReply: true, status: 'answered' }),
          makeInquiry('b'),
        ],
        nextPage: null,
      } as never);
      renderPage();

      const unread = await screen.findByRole('link', { name: /제목 a/ });
      const read = screen.getByRole('link', { name: /제목 b/ });

      expect(unread).toHaveAttribute('data-unread', 'true');
      expect(within(unread).getByText('새 답변')).toBeInTheDocument();
      expect(read).not.toHaveAttribute('data-unread', 'true');
      expect(within(read).queryByText('새 답변')).not.toBeInTheDocument();
    });

    it('서버가 준 순서(미확인 우선, 최신순)를 그대로 유지한다', async () => {
      vi.mocked(getMyInquiries).mockResolvedValue({
        items: [makeInquiry('b'), makeInquiry('a'), makeInquiry('c')],
        nextPage: null,
      } as never);
      renderPage();

      await screen.findByText('제목 b');

      const hrefs = screen
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
        .filter((href) => href?.startsWith('/support/inquiries/'));
      expect(hrefs).toEqual([
        '/support/inquiries/b',
        '/support/inquiries/a',
        '/support/inquiries/c',
      ]);
    });
  });

  describe('로딩 / 빈 상태 / 오류', () => {
    it('불러오는 동안 aria-busy 스켈레톤을 보이고 탭은 이미 보인다', () => {
      vi.mocked(getMyInquiries).mockReturnValue(new Promise(() => {}));
      const { container } = renderPage();

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('전체 탭이 비어 있으면 빈 상태와 "1:1 문의하기" 링크를 보인다', async () => {
      vi.mocked(getMyInquiries).mockResolvedValue({
        items: [],
        nextPage: null,
      } as never);
      renderPage('all');

      expect(
        await screen.findByText('아직 남긴 문의가 없어요.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: '1:1 문의하기' }),
      ).toHaveAttribute('href', '/support/inquiries/new');
    });

    it.each([
      ['waiting', '답변 대기 문의가 없어요.'],
      ['answered', '답변 완료 문의가 없어요.'],
      ['closed', '종결 문의가 없어요.'],
    ] as const)(
      '%s 탭이 비어 있으면 탭 이름을 쓴 문구를 보이고 "아직 남긴 문의가 없어요." 는 쓰지 않는다',
      async (status, text) => {
        vi.mocked(getMyInquiries).mockResolvedValue({
          items: [],
          nextPage: null,
        } as never);
        renderPage(status);

        expect(await screen.findByText(text)).toBeInTheDocument();
        expect(
          screen.queryByText('아직 남긴 문의가 없어요.'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText('이 상태의 문의가 없어요.'),
        ).not.toBeInTheDocument();
      },
    );

    it('필터된 빈 상태의 "전체 보기" 는 전체 탭으로 바꾸고 URL 을 replace(scroll false) 한다', async () => {
      vi.mocked(getMyInquiries).mockImplementation((async (
        _supabase: unknown,
        { status }: { status: string },
      ) => ({
        items: status === 'all' ? [makeInquiry('a')] : [],
        nextPage: null,
      })) as never);
      renderPage('closed');
      await screen.findByText('종결 문의가 없어요.');

      fireEvent.click(screen.getByRole('button', { name: '전체 보기' }));

      expect(router.replace).toHaveBeenCalledWith('/support/inquiries', {
        scroll: false,
      });
      expect(router.push).not.toHaveBeenCalled();
      expect(await screen.findByText('제목 a')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '전체' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('전체 탭의 빈 상태에는 "전체 보기" 버튼이 없다', async () => {
      vi.mocked(getMyInquiries).mockResolvedValue({
        items: [],
        nextPage: null,
      } as never);
      renderPage('all');
      await screen.findByText('아직 남긴 문의가 없어요.');

      expect(
        screen.queryByRole('button', { name: '전체 보기' }),
      ).not.toBeInTheDocument();
    });

    it('조회에 실패하면 오류 문구와 "다시 시도" 를 보이고, 누르면 다시 조회한다', async () => {
      vi.mocked(getMyInquiries).mockRejectedValueOnce(new Error('network'));
      renderPage();

      expect(
        await screen.findByText(
          '연결이 불안정해요. 잠시 후 다시 시도해주세요.',
        ),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

      expect(await screen.findByText('제목 a')).toBeInTheDocument();
      expect(getMyInquiries).toHaveBeenCalledTimes(2);
      expect(
        screen.queryByText('연결이 불안정해요. 잠시 후 다시 시도해주세요.'),
      ).not.toBeInTheDocument();
    });
  });

  describe('결과 수 안내 (live region)', () => {
    it('로딩 중에도 role="status" 영역이 이미 마운트돼 있고 비어 있다', () => {
      vi.mocked(getMyInquiries).mockReturnValue(new Promise(() => {}));
      renderPage();

      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      expect(statusText()).not.toMatch(/문의 \d+건/);
    });

    it('로드가 끝나면 "문의 N건" 을 알린다', async () => {
      vi.mocked(getMyInquiries).mockResolvedValue({
        items: [makeInquiry('a'), makeInquiry('b')],
        nextPage: null,
      } as never);
      renderPage();

      await waitFor(() => expect(statusText()).toContain('전체 문의 2건'));
    });

    it('탭(status)이 바뀌어 다시 로드되면 새 결과 수를 알린다', async () => {
      vi.mocked(getMyInquiries).mockImplementation((async (
        _supabase: unknown,
        { status }: { status: string },
      ) => ({
        items:
          status === 'all'
            ? [makeInquiry('a'), makeInquiry('b')]
            : [makeInquiry('c')],
        nextPage: null,
      })) as never);
      const { rerenderWith } = renderPage('all');
      await waitFor(() => expect(statusText()).toContain('전체 문의 2건'));

      rerenderWith('answered');

      await waitFor(() => expect(statusText()).toContain('답변 완료 문의 1건'));
    });

    it('연속으로 더 불러와도 안내 문구가 매번 달라지고(총 건수 포함) 불러올 때마다 한 번씩만 알린다', async () => {
      stubObserver();
      const makePage = (from: number, nextPage: number | null) => ({
        items: Array.from({ length: 20 }, (_, i) =>
          makeInquiry(`n${from + i}`),
        ),
        nextPage,
      });
      vi.mocked(getMyInquiries)
        .mockResolvedValueOnce(makePage(0, 1) as never)
        .mockResolvedValueOnce(makePage(20, 2) as never)
        .mockResolvedValueOnce(makePage(40, null) as never);
      const { client } = renderPage();
      await waitFor(() => expect(statusText()).toContain('전체 문의 20건'));

      const loadMoreTexts: string[] = [];
      const mutationObserver = new MutationObserver(() => {
        const text = screen
          .queryAllByRole('status')
          .map((element) => element.textContent)
          .join(' ')
          .trim();
        if (text.includes('더 불러왔어요')) loadMoreTexts.push(text);
      });
      mutationObserver.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
      });

      intersect();
      await waitFor(() =>
        expect(statusText().trim()).toBe('문의 20건 더 불러왔어요 (총 40건)'),
      );
      await waitForIdle(client);

      intersect();
      await waitFor(() =>
        expect(statusText().trim()).toBe('문의 20건 더 불러왔어요 (총 60건)'),
      );
      await waitForIdle(client);
      await act(async () => {});
      mutationObserver.disconnect();

      expect(loadMoreTexts).toEqual([
        '문의 20건 더 불러왔어요 (총 40건)',
        '문의 20건 더 불러왔어요 (총 60건)',
      ]);
    });

    it('다음 페이지를 붙일 때는 전체 수를 다시 읽지 않고 "문의 N건 더 불러왔어요 (총 M건)" 으로 한 번만 알린다', async () => {
      stubObserver();
      vi.mocked(getMyInquiries)
        .mockResolvedValueOnce({
          items: [makeInquiry('a'), makeInquiry('b')],
          nextPage: 1,
        } as never)
        .mockResolvedValueOnce({
          items: [makeInquiry('c')],
          nextPage: null,
        } as never);
      const { client } = renderPage();
      await waitFor(() => expect(statusText()).toContain('전체 문의 2건'));

      intersect();
      await screen.findByText('제목 c');
      await waitForIdle(client);

      await waitFor(() =>
        expect(statusText().trim()).toBe('문의 1건 더 불러왔어요 (총 3건)'),
      );
      expect(statusText()).not.toMatch(/전체 문의 \d+건/);
    });
  });

  describe('무한 스크롤', () => {
    const twoPages = () =>
      vi
        .mocked(getMyInquiries)
        .mockResolvedValueOnce({
          items: [makeInquiry('a'), makeInquiry('b')],
          nextPage: 1,
        } as never)
        .mockResolvedValueOnce({
          items: [makeInquiry('c')],
          nextPage: null,
        } as never);

    it('센티널이 교차하면 다음 페이지를 한 번만 불러오고 카드를 이어 붙인다', async () => {
      stubObserver();
      twoPages();
      renderPage();
      await screen.findByText('제목 a');

      intersect();
      intersect();

      expect(await screen.findByText('제목 c')).toBeInTheDocument();
      expect(pagesCalled(1)).toHaveLength(1);
      expect(screen.getByText('제목 a')).toBeInTheDocument();
      expect(getMyInquiries).toHaveBeenLastCalledWith(SUPABASE, {
        userId: 'user-1',
        page: 1,
        status: 'all',
      });
    });

    it('교차하지 않으면 불러오지 않는다', async () => {
      stubObserver();
      twoPages();
      renderPage();
      await screen.findByText('제목 a');

      intersect(false);

      expect(pagesCalled(1)).toHaveLength(0);
    });

    it('마지막 페이지 이후에는 교차해도 더 불러오지 않는다', async () => {
      stubObserver();
      twoPages();
      renderPage();
      await screen.findByText('제목 a');
      intersect();
      await screen.findByText('제목 c');

      intersect();

      expect(getMyInquiries).toHaveBeenCalledTimes(2);
    });

    it('IntersectionObserver 가 있으면 "더 보기" 버튼을 보이지 않는다', async () => {
      stubObserver();
      twoPages();
      renderPage();
      await screen.findByText('제목 a');

      expect(
        screen.queryByRole('button', { name: '더 보기' }),
      ).not.toBeInTheDocument();
    });

    it('IntersectionObserver 가 없으면 "더 보기" 버튼으로 다음 페이지를 불러오고, 끝나면 버튼이 사라진다', async () => {
      twoPages();
      renderPage();
      await screen.findByText('제목 a');

      fireEvent.click(screen.getByRole('button', { name: '더 보기' }));

      expect(await screen.findByText('제목 c')).toBeInTheDocument();
      expect(pagesCalled(1)).toHaveLength(1);
      expect(
        screen.queryByRole('button', { name: '더 보기' }),
      ).not.toBeInTheDocument();
    });

    it('다음 페이지가 없으면 "더 보기" 버튼도 없다', async () => {
      renderPage();
      await screen.findByText('제목 a');

      expect(
        screen.queryByRole('button', { name: '더 보기' }),
      ).not.toBeInTheDocument();
    });

    it('다음 페이지 조회가 실패해도 불러온 카드는 그대로 두고 인라인 "다시 시도" 행을 보인다', async () => {
      stubObserver();
      vi.mocked(getMyInquiries)
        .mockResolvedValueOnce({
          items: [makeInquiry('a'), makeInquiry('b')],
          nextPage: 1,
        } as never)
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce({
          items: [makeInquiry('c')],
          nextPage: null,
        } as never);
      renderPage();
      await screen.findByText('제목 a');

      intersect();

      const alert = await screen.findByRole('alert');
      expect(
        within(alert).getByRole('button', { name: '다시 시도' }),
      ).toBeVisible();
      expect(screen.getByText('제목 a')).toBeInTheDocument();
      expect(screen.getByText('제목 b')).toBeInTheDocument();
      expect(
        screen.queryByText('연결이 불안정해요. 잠시 후 다시 시도해주세요.'),
      ).not.toBeInTheDocument();
    });

    it('인라인 "다시 시도" 는 같은 다음 페이지를 다시 요청하고 성공하면 행이 사라진다', async () => {
      stubObserver();
      vi.mocked(getMyInquiries)
        .mockResolvedValueOnce({
          items: [makeInquiry('a')],
          nextPage: 1,
        } as never)
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce({
          items: [makeInquiry('c')],
          nextPage: null,
        } as never);
      renderPage();
      await screen.findByText('제목 a');
      intersect();
      const retry = await screen.findByRole('button', { name: '다시 시도' });
      retry.focus();

      fireEvent.click(retry);

      expect(await screen.findByText('제목 c')).toBeInTheDocument();
      expect(pagesCalled(1)).toHaveLength(2);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(document.body).not.toHaveFocus();
    });
    it('이미 불러온 목록의 백그라운드 재조회가 실패해도 다음 페이지 재시도 행을 보이지 않고 자동 불러오기를 막지 않는다', async () => {
      stubObserver();
      vi.mocked(getMyInquiries)
        .mockResolvedValueOnce({
          items: [makeInquiry('a'), makeInquiry('b')],
          nextPage: 1,
        } as never)
        .mockRejectedValueOnce(new Error('background'))
        .mockResolvedValue({
          items: [makeInquiry('c')],
          nextPage: null,
        } as never);
      const { client } = renderPage();
      await screen.findByText('제목 a');

      await act(async () => {
        await client.invalidateQueries();
      });
      await waitForIdle(client);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          '다음 문의를 불러오지 못했어요. 연결을 확인해주세요.',
        ),
      ).not.toBeInTheDocument();
      expect(screen.getByText('제목 a')).toBeInTheDocument();

      intersect();

      expect(await screen.findByText('제목 c')).toBeInTheDocument();
      expect(pagesCalled(1)).toHaveLength(1);
    });

    it('같은 id 가 두 페이지에 있어도 카드는 한 번만 그리고 React key 경고도 없다', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      stubObserver();
      vi.mocked(getMyInquiries)
        .mockResolvedValueOnce({
          items: [makeInquiry('a'), makeInquiry('b')],
          nextPage: 1,
        } as never)
        .mockResolvedValueOnce({
          items: [makeInquiry('b'), makeInquiry('c')],
          nextPage: null,
        } as never);
      const { client } = renderPage();
      await screen.findByText('제목 a');

      intersect();
      await screen.findByText('제목 c');
      await waitForIdle(client);

      expect(screen.getAllByText('제목 b')).toHaveLength(1);
      expect(
        screen
          .getAllByRole('link')
          .map((link) => link.getAttribute('href'))
          .filter((href) => href?.startsWith('/support/inquiries/')),
      ).toEqual([
        '/support/inquiries/a',
        '/support/inquiries/b',
        '/support/inquiries/c',
      ]);
      const keyWarnings = errorSpy.mock.calls.filter((call) =>
        call.some(
          (arg) =>
            typeof arg === 'string' &&
            /same key|unique "key"|duplicate/i.test(arg),
        ),
      );
      expect(keyWarnings).toHaveLength(0);
      errorSpy.mockRestore();
    });
  });
});
