import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAdminInquiries,
  parseAdminInquiryFilters,
  type AdminInquiryFilters,
} from '@/entities/admin';
import { INQUIRY_CATEGORY_LABELS } from '@/entities/inquiry';
import { useToast } from '@/shared/ui';

import { AdminInquiriesPage } from './index';

const SUPABASE = { __supabase: true };
const NOW = Date.parse('2026-10-02T12:00:00Z');
const HOUR_MS = 60 * 60 * 1000;

const router = {
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/admin/inquiries',
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createBrowserClient: () => SUPABASE,
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getAdminInquiries: vi.fn(),
  getAdminPendingCount: vi.fn(async () => 0),
}));

type Status = 'waiting' | 'in_progress' | 'answered' | 'closed';

const hoursAgo = (hours: number) =>
  new Date(NOW - hours * HOUR_MS).toISOString();

const makeItem = (
  id: string,
  overrides: Partial<{
    title: string;
    status: Status;
    category: string | null;
    categoryConfidence: number | null;
    waitingSince: string;
    assigneeId: string | null;
    assigneeEmail: string | null;
  }> = {},
) => ({
  id,
  title: `제목 ${id}`,
  status: 'waiting' as Status,
  category: 'account_login',
  categoryConfidence: 0.93,
  waitingSince: hoursAgo(5),
  createdAt: hoursAgo(5),
  assigneeId: 'op-1',
  assigneeEmail: 'opa@moa.test',
  ...overrides,
});

const filtersOf = (query: Record<string, string> = {}) =>
  parseAdminInquiryFilters(query);

const respond = (items: ReturnType<typeof makeItem>[], total = items.length) =>
  vi.mocked(getAdminInquiries).mockResolvedValue({ items, total } as never);

const renderPage = (filters: AdminInquiryFilters = filtersOf()) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ui = (f: AdminInquiryFilters) => (
    <QueryClientProvider client={client}>
      <AdminInquiriesPage filters={f} />
    </QueryClientProvider>
  );
  const result = render(ui(filters));

  return {
    ...result,
    client,
    rerenderWith: (f: AdminInquiryFilters) => result.rerender(ui(f)),
  };
};

/** router.replace 로 넘어온 URL 을 필터로 되읽는다. 직렬화 형식에는 의존하지 않는다. */
const filtersFromUrl = (url: string) => {
  const [path, query = ''] = url.split('?');

  expect(path).toBe('/admin/inquiries');

  return parseAdminInquiryFilters(
    Object.fromEntries(new URLSearchParams(query)),
  );
};

const lastReplacedFilters = () => {
  const calls = router.replace.mock.calls;

  expect(calls.length).toBeGreaterThan(0);
  expect(calls[calls.length - 1][1]).toEqual({ scroll: false });

  return filtersFromUrl(calls[calls.length - 1][0] as string);
};

const choose = (select: HTMLElement, label: string) => {
  const option = within(select).getByRole('option', {
    name: label,
  }) as HTMLOptionElement;

  fireEvent.change(select, { target: { value: option.value } });
};

const tableRegion = () => screen.getByRole('table', { name: '문의 목록' });

const rowOf = (title: string) => {
  const row = screen.getByRole('link', { name: title }).closest('tr');

  expect(row).not.toBeNull();

  return row as HTMLElement;
};

const cellsOf = (title: string) => within(rowOf(title)).getAllByRole('cell');

const waitForRows = async () =>
  (await screen.findAllByRole('link', { name: /^제목 / }))[0];

const statusRegion = () => screen.getByRole('status');

const settledStatus = (text: string) =>
  waitFor(() => expect(statusRegion().textContent?.trim()).toBe(text));

/** aria-describedby 가 가리키는 요소들의 텍스트. 연결 방식 외의 구현에는 의존하지 않는다. */
const describedText = (element: HTMLElement) =>
  (element.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ')
    .trim();

const keywordInput = () => screen.getByLabelText('제목·내용 검색');
const resetButton = () => screen.getByRole('button', { name: '초기화' });
const waitUntilReplaced = (times: number) =>
  waitFor(() => expect(router.replace).toHaveBeenCalledTimes(times), {
    timeout: 1500,
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAdminInquiries).mockReset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  respond([makeItem('a')]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AdminInquiriesPage', () => {
  describe('조회', () => {
    it('받은 filters 로 SUPABASE 클라이언트와 함께 목록을 조회한다', async () => {
      const filters = filtersOf({ category: 'bug_report', page: '2' });
      renderPage(filters);

      await waitForRows();

      expect(getAdminInquiries).toHaveBeenCalledWith(SUPABASE, filters);
    });

    it('제목 "문의 관리" h1 이 있다', async () => {
      renderPage();

      expect(
        screen.getByRole('heading', { level: 1, name: '문의 관리' }),
      ).toBeInTheDocument();
      await waitForRows();
    });
  });

  describe('필터 표시', () => {
    it('기본 필터: 답변 대기·처리 중만 체크, 카테고리 전체, 기간 전체, 미분류만 꺼짐, 검색어 비어 있음', async () => {
      renderPage();
      const group = screen.getByRole('group', { name: '상태' });

      expect(within(group).getByLabelText('답변 대기')).toBeChecked();
      expect(within(group).getByLabelText('처리 중')).toBeChecked();
      expect(within(group).getByLabelText('답변 완료')).not.toBeChecked();
      expect(within(group).getByLabelText('종결')).not.toBeChecked();
      expect(
        screen.getByRole('combobox', { name: '카테고리' }),
      ).toHaveDisplayValue('전체');
      expect(screen.getByRole('combobox', { name: '기간' })).toHaveDisplayValue(
        '전체',
      );
      expect(screen.getByRole('button', { name: '미분류만' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(screen.getByLabelText('제목·내용 검색')).toHaveValue('');
      await waitForRows();
    });

    it('카테고리 select 는 전체와 7개 카테고리 라벨을 모두 가진다', async () => {
      renderPage();

      const options = within(screen.getByRole('combobox', { name: '카테고리' }))
        .getAllByRole('option')
        .map((option) => option.textContent);

      expect(options).toEqual([
        '전체',
        ...Object.values(INQUIRY_CATEGORY_LABELS),
      ]);
      await waitForRows();
    });

    it('기간 select 는 최근 7일/30일/90일/전체 를 가진다', async () => {
      renderPage();

      const options = within(screen.getByRole('combobox', { name: '기간' }))
        .getAllByRole('option')
        .map((option) => option.textContent);

      expect(options).toEqual(['최근 7일', '최근 30일', '최근 90일', '전체']);
      await waitForRows();
    });

    it('상태에 답변 완료/종결이 들어간 기본 기간(30일)은 "최근 30일" 로 보인다', async () => {
      renderPage(filtersOf({ status: 'answered' }));

      expect(screen.getByRole('combobox', { name: '기간' })).toHaveDisplayValue(
        '최근 30일',
      );
      await waitForRows();
    });

    it('filters prop 값이 컨트롤에 반영된다', async () => {
      renderPage(
        filtersOf({
          status: 'answered,closed',
          category: 'bug_report',
          period: 'all',
          uncategorized: '1',
          q: '결제',
        }),
      );
      const group = screen.getByRole('group', { name: '상태' });

      expect(within(group).getByLabelText('답변 대기')).not.toBeChecked();
      expect(within(group).getByLabelText('답변 완료')).toBeChecked();
      expect(within(group).getByLabelText('종결')).toBeChecked();
      expect(
        screen.getByRole('combobox', { name: '카테고리' }),
      ).toHaveDisplayValue(INQUIRY_CATEGORY_LABELS.bug_report);
      expect(screen.getByRole('combobox', { name: '기간' })).toHaveDisplayValue(
        '전체',
      );
      expect(screen.getByRole('button', { name: '미분류만' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByLabelText('제목·내용 검색')).toHaveValue('결제');
      await waitForRows();
    });
  });

  describe('필터 변경은 URL 로 반영한다', () => {
    it('상태 체크박스를 켜면 해당 상태가 추가된 URL 로 replace 한다 (scroll:false, push 아님)', async () => {
      renderPage();
      await waitForRows();

      fireEvent.click(screen.getByLabelText('답변 완료'));

      expect(lastReplacedFilters().statuses).toEqual([
        'waiting',
        'in_progress',
        'answered',
      ]);
      expect(router.push).not.toHaveBeenCalled();
    });

    it('상태 체크박스를 끄면 해당 상태가 빠진다', async () => {
      renderPage();
      await waitForRows();

      fireEvent.click(screen.getByLabelText('답변 대기'));

      expect(lastReplacedFilters().statuses).toEqual(['in_progress']);
    });

    it('카테고리를 고르면 category 가 바뀐다', async () => {
      renderPage();
      await waitForRows();

      choose(
        screen.getByRole('combobox', { name: '카테고리' }),
        INQUIRY_CATEGORY_LABELS.bug_report,
      );

      expect(lastReplacedFilters().category).toBe('bug_report');
    });

    it('기간을 고르면 periodDays 가 바뀌고 "전체" 는 null 이다', async () => {
      renderPage();
      await waitForRows();
      const select = screen.getByRole('combobox', { name: '기간' });

      choose(select, '최근 7일');
      expect(lastReplacedFilters().periodDays).toBe(7);

      choose(select, '전체');
      expect(lastReplacedFilters().periodDays).toBeNull();
    });

    it('"미분류만" 을 누르면 uncategorizedOnly 가 켜지고, 켜진 상태에서 누르면 꺼진다', async () => {
      const { rerenderWith } = renderPage();
      await waitForRows();

      fireEvent.click(screen.getByRole('button', { name: '미분류만' }));
      expect(lastReplacedFilters().uncategorizedOnly).toBe(true);

      rerenderWith(filtersOf({ uncategorized: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '미분류만' }));
      expect(lastReplacedFilters().uncategorizedOnly).toBe(false);
    });

    it('"미분류만" 을 켜면 카테고리 선택은 해제된다 (서로 모순되는 조합 방지)', async () => {
      renderPage(filtersOf({ category: 'bug_report' }));
      await waitForRows();

      fireEvent.click(screen.getByRole('button', { name: '미분류만' }));

      expect(lastReplacedFilters()).toMatchObject({
        uncategorizedOnly: true,
        category: null,
      });
    });

    it('어떤 필터를 바꿔도 page 는 1 로 돌아가고 나머지 필터는 유지된다', async () => {
      renderPage(
        filtersOf({ page: '3', size: '50', sort: 'confidence', dir: 'desc' }),
      );
      await waitForRows();

      choose(
        screen.getByRole('combobox', { name: '카테고리' }),
        INQUIRY_CATEGORY_LABELS.other,
      );

      expect(lastReplacedFilters()).toMatchObject({
        page: 1,
        pageSize: 50,
        sort: 'confidence',
        sortDir: 'desc',
        category: 'other',
      });
    });

    it('필터 변경은 prop 이 바뀌기 전까지 화면 값을 스스로 바꾸지 않는다 (URL 이 단일 출처)', async () => {
      renderPage();
      await waitForRows();

      fireEvent.click(screen.getByLabelText('답변 완료'));

      expect(screen.getByLabelText('답변 완료')).not.toBeChecked();
    });
  });

  describe('키워드 검색', () => {
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    it('2자 이상 입력은 300ms 디바운스 뒤에 적용되고 즉시는 적용되지 않는다', async () => {
      renderPage();
      await waitForRows();

      fireEvent.change(screen.getByLabelText('제목·내용 검색'), {
        target: { value: '앱이' },
      });

      expect(router.replace).not.toHaveBeenCalled();
      await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1), {
        timeout: 1500,
      });
      expect(lastReplacedFilters().keyword).toBe('앱이');
    });

    it('디바운스 중 계속 입력하면 마지막 값으로 한 번만 적용된다', async () => {
      renderPage();
      await waitForRows();
      const input = screen.getByLabelText('제목·내용 검색');

      fireEvent.change(input, { target: { value: '앱이' } });
      fireEvent.change(input, { target: { value: '앱이 꺼' } });

      await waitFor(() => expect(router.replace).toHaveBeenCalled(), {
        timeout: 1500,
      });
      await sleep(400);
      expect(router.replace).toHaveBeenCalledTimes(1);
      expect(lastReplacedFilters().keyword).toBe('앱이 꺼');
    });

    it('Enter 는 디바운스를 기다리지 않고 바로 적용한다', async () => {
      renderPage();
      await waitForRows();
      const input = screen.getByLabelText('제목·내용 검색');

      fireEvent.change(input, { target: { value: '결제' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(lastReplacedFilters().keyword).toBe('결제');
    });

    it('검색어 적용 시 page 는 1 로 돌아간다', async () => {
      renderPage(filtersOf({ page: '3' }));
      await waitForRows();
      const input = screen.getByLabelText('제목·내용 검색');

      fireEvent.change(input, { target: { value: '결제' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(lastReplacedFilters().page).toBe(1);
    });

    it('1자는 디바운스가 지나도 Enter 를 눌러도 적용되지 않는다', async () => {
      renderPage();
      await waitForRows();
      const input = screen.getByLabelText('제목·내용 검색');

      fireEvent.change(input, { target: { value: '앱' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await sleep(450);

      expect(router.replace).not.toHaveBeenCalled();
      expect(input).toHaveValue('앱');
    });

    it('적용된 검색어를 모두 지우면 필터가 해제된다 (빈 검색어)', async () => {
      renderPage(filtersOf({ q: '결제' }));
      await waitForRows();

      fireEvent.change(screen.getByLabelText('제목·내용 검색'), {
        target: { value: '' },
      });

      await waitFor(() => expect(router.replace).toHaveBeenCalled(), {
        timeout: 1500,
      });
      expect(lastReplacedFilters().keyword).toBe('');
    });

    it('filters.keyword 가 바깥에서 바뀌면(초기화 등) 입력창도 따라간다', async () => {
      const { rerenderWith } = renderPage(filtersOf({ q: '결제' }));
      await waitForRows();
      expect(screen.getByLabelText('제목·내용 검색')).toHaveValue('결제');

      rerenderWith(filtersOf());

      expect(screen.getByLabelText('제목·내용 검색')).toHaveValue('');
    });
  });

  describe('표', () => {
    it('caption "문의 목록" 이 있는 table 에 6개 컬럼 헤더가 순서대로 있다', async () => {
      renderPage();
      await waitForRows();

      const headers = within(tableRegion())
        .getAllByRole('columnheader')
        .map((header) => header.textContent?.trim());

      expect(headers).toEqual([
        '상태',
        '카테고리 (Jev)',
        '제목',
        '신뢰도',
        '대기',
        '담당자',
      ]);
    });

    it('행은 상태(관리자 라벨)/카테고리/제목/신뢰도/대기/담당자 순으로 값을 보여준다', async () => {
      respond([
        makeItem('a', {
          status: 'in_progress',
          category: 'bug_report',
          categoryConfidence: 0.8,
          waitingSince: hoursAgo(5),
          assigneeEmail: 'opb@moa.test',
        }),
      ]);
      renderPage();
      await waitForRows();

      const cells = cellsOf('제목 a');

      expect(cells).toHaveLength(6);
      expect(cells[0]).toHaveTextContent('처리 중');
      expect(cells[1]).toHaveTextContent(INQUIRY_CATEGORY_LABELS.bug_report);
      expect(cells[2]).toHaveTextContent('제목 a');
      expect(cells[3]).toHaveTextContent('0.80');
      expect(cells[4]).toHaveTextContent('5시간');
      expect(cells[5]).toHaveTextContent('opb');
      expect(cells[5]).not.toHaveTextContent('@moa.test');
    });

    it('상태는 4종 모두 관리자 라벨로 보인다 (처리 중도 "답변 대기" 로 합치지 않는다)', async () => {
      respond([
        makeItem('w', { status: 'waiting' }),
        makeItem('p', { status: 'in_progress' }),
        makeItem('d', { status: 'answered' }),
        makeItem('c', { status: 'closed' }),
      ]);
      renderPage();
      await waitForRows();

      expect(cellsOf('제목 w')[0]).toHaveTextContent('답변 대기');
      expect(cellsOf('제목 p')[0]).toHaveTextContent('처리 중');
      expect(cellsOf('제목 d')[0]).toHaveTextContent('답변 완료');
      expect(cellsOf('제목 c')[0]).toHaveTextContent('종결');
    });

    it('신뢰도는 소수 둘째 자리까지, 없으면 "—"', async () => {
      respond([
        makeItem('a', { categoryConfidence: 0.5 }),
        makeItem('b', { categoryConfidence: null }),
      ]);
      renderPage();
      await waitForRows();

      expect(cellsOf('제목 a')[3]).toHaveTextContent('0.50');
      expect(cellsOf('제목 b')[3]).toHaveTextContent('—');
    });

    describe('대기 시간 형식', () => {
      it.each([
        [0.5, '1시간 미만'],
        [1, '1시간'],
        [5, '5시간'],
        [23, '23시간'],
        [24, '1일'],
        [26, '1일 2시간'],
        [47, '1일 23시간'],
        [48, '2일'],
        [100, '4일 4시간'],
      ])('%s시간 경과 -> %s', async (hours, text) => {
        respond([
          makeItem('a', {
            status: 'in_progress',
            waitingSince: hoursAgo(hours),
          }),
        ]);
        renderPage();
        await waitForRows();

        expect(cellsOf('제목 a')[4]).toHaveTextContent(text);
      });

      it('답변 완료·종결 행은 "—" 이고 보조기기에는 "대기 시간 없음" 이 읽힌다', async () => {
        respond([
          makeItem('b', { status: 'answered', waitingSince: hoursAgo(100) }),
          makeItem('c', { status: 'closed', waitingSince: hoursAgo(100) }),
        ]);
        renderPage();
        await waitForRows();

        for (const title of ['제목 b', '제목 c']) {
          const cell = cellsOf(title)[4];

          expect(cell).toHaveTextContent('—');
          expect(within(cell).getByText('대기 시간 없음')).toBeInTheDocument();
          expect(cell).not.toHaveTextContent('일');
        }
      });

      it('진행 중 행에는 "대기 시간 없음" 이 없다', async () => {
        renderPage();
        await waitForRows();

        expect(
          within(cellsOf('제목 a')[4]).queryByText('대기 시간 없음'),
        ).not.toBeInTheDocument();
      });
    });

    it('담당자가 없으면 "미지정"', async () => {
      respond([makeItem('a', { assigneeId: null, assigneeEmail: null })]);
      renderPage();
      await waitForRows();

      expect(cellsOf('제목 a')[5]).toHaveTextContent('미지정');
    });

    it('미분류 행은 카테고리 칸에 "미분류" 를 보이고 data-uncategorized 표시가 붙는다', async () => {
      respond([
        makeItem('a', { category: null, categoryConfidence: null }),
        makeItem('b'),
      ]);
      renderPage();
      await waitForRows();

      expect(cellsOf('제목 a')[1]).toHaveTextContent('미분류');
      expect(rowOf('제목 a')).toHaveAttribute('data-uncategorized', 'true');
      expect(rowOf('제목 b')).not.toHaveAttribute('data-uncategorized', 'true');
    });

    describe('24시간 초과 경고', () => {
      it('24시간을 넘긴 대기 건은 data-overdue 와 시각장애 사용자용 "24시간 초과" 텍스트를 가진다', async () => {
        respond([makeItem('a', { waitingSince: hoursAgo(26) })]);
        renderPage();
        await waitForRows();

        const row = rowOf('제목 a');

        expect(row).toHaveAttribute('data-overdue', 'true');
        expect(within(row).getByText(/24시간 초과/)).toBeInTheDocument();
      });

      it('대기 칸은 "{표기} (24시간 초과)" 로 읽히고 눈에 보이는 "초과" 표시도 있다', async () => {
        respond([makeItem('a', { waitingSince: hoursAgo(26) })]);
        renderPage();
        await waitForRows();

        const cell = cellsOf('제목 a')[4];

        // 보조기기용 문구는 시간 표기와 공백으로 띄운다 (붙어서 읽히지 않게).
        expect(cell.textContent).toContain('1일 2시간 (24시간 초과)');
        expect(within(cell).getByText('초과')).toBeVisible();
      });

      it('경고가 아닌 행에는 "초과" 표시도 보조 문구도 없다', async () => {
        respond([makeItem('a', { waitingSince: hoursAgo(5) })]);
        renderPage();
        await waitForRows();

        const cell = cellsOf('제목 a')[4];

        expect(within(cell).queryByText('초과')).not.toBeInTheDocument();
        expect(cell.textContent).not.toContain('24시간 초과');
      });

      it('정확히 24시간, 그 이하는 경고가 아니다', async () => {
        respond([
          makeItem('a', { waitingSince: hoursAgo(24) }),
          makeItem('b', { waitingSince: hoursAgo(5) }),
        ]);
        renderPage();
        await waitForRows();

        for (const title of ['제목 a', '제목 b']) {
          expect(rowOf(title)).not.toHaveAttribute('data-overdue', 'true');
          expect(
            within(rowOf(title)).queryByText(/24시간 초과/),
          ).not.toBeInTheDocument();
          expect(
            within(rowOf(title)).queryByText('초과'),
          ).not.toBeInTheDocument();
        }
      });

      it('답변 완료·종결 건은 오래됐어도 경고가 아니다', async () => {
        respond([
          makeItem('a', { status: 'answered', waitingSince: hoursAgo(100) }),
          makeItem('b', { status: 'closed', waitingSince: hoursAgo(100) }),
        ]);
        renderPage();
        await waitForRows();

        for (const title of ['제목 a', '제목 b']) {
          expect(rowOf(title)).not.toHaveAttribute('data-overdue', 'true');
        }
      });

      it('처리 중 건도 24시간을 넘기면 경고다', async () => {
        respond([
          makeItem('a', { status: 'in_progress', waitingSince: hoursAgo(30) }),
        ]);
        renderPage();
        await waitForRows();

        expect(rowOf('제목 a')).toHaveAttribute('data-overdue', 'true');
      });
    });

    describe('행 이동', () => {
      it('제목은 /admin/inquiries/{id} 로 가는 링크다', async () => {
        respond([makeItem('abc-1')]);
        renderPage();

        expect(
          await screen.findByRole('link', { name: '제목 abc-1' }),
        ).toHaveAttribute('href', '/admin/inquiries/abc-1');
      });

      it('행의 다른 영역을 클릭하면 router.push 로 상세로 이동한다', async () => {
        respond([makeItem('abc-1')]);
        renderPage();
        await waitForRows();

        fireEvent.click(cellsOf('제목 abc-1')[1]);

        expect(router.push).toHaveBeenCalledTimes(1);
        expect(router.push).toHaveBeenCalledWith('/admin/inquiries/abc-1');
      });

      it('Ctrl+클릭·Cmd+클릭은 push 하지 않는다 (새 탭 열기 의도)', async () => {
        renderPage();
        await waitForRows();

        fireEvent.click(cellsOf('제목 a')[1], { ctrlKey: true });
        fireEvent.click(cellsOf('제목 a')[1], { metaKey: true });

        expect(router.push).not.toHaveBeenCalled();
      });

      it('가운데 버튼(button 1) 클릭은 push 하지 않는다', async () => {
        renderPage();
        await waitForRows();

        fireEvent.click(cellsOf('제목 a')[1], { button: 1 });

        expect(router.push).not.toHaveBeenCalled();
      });

      it('텍스트를 드래그해 선택한 상태의 클릭은 push 하지 않는다', async () => {
        renderPage();
        await waitForRows();
        const selection = vi.spyOn(window, 'getSelection').mockReturnValue({
          toString: () => '선택한 글자',
        } as unknown as Selection);

        try {
          fireEvent.click(cellsOf('제목 a')[2]);

          expect(router.push).not.toHaveBeenCalled();
        } finally {
          selection.mockRestore();
        }
      });

      it('선택이 비어 있으면 평소처럼 이동한다', async () => {
        renderPage();
        await waitForRows();
        const selection = vi.spyOn(window, 'getSelection').mockReturnValue({
          toString: () => '',
        } as unknown as Selection);

        try {
          fireEvent.click(cellsOf('제목 a')[2]);

          expect(router.push).toHaveBeenCalledTimes(1);
        } finally {
          selection.mockRestore();
        }
      });

      it('제목 링크에는 전체 제목이 title 속성으로 달려 있다 (잘려 보여도 확인 가능)', async () => {
        const long = '아주 긴 제목 '.repeat(20).trim();
        respond([makeItem('a', { title: long })]);
        renderPage();

        expect(await screen.findByRole('link', { name: long })).toHaveAttribute(
          'title',
          long,
        );
      });

      it('제목 링크를 직접 누르면 링크가 이동을 맡고 router.push 를 중복 호출하지 않는다', async () => {
        respond([makeItem('abc-1')]);
        renderPage();
        const link = await screen.findByRole('link', { name: '제목 abc-1' });
        link.addEventListener('click', (event) => event.preventDefault());

        fireEvent.click(link);

        expect(router.push).not.toHaveBeenCalled();
      });
    });
  });

  describe('정렬 헤더', () => {
    const header = (name: RegExp) => screen.getByRole('columnheader', { name });

    it('기본(오래 기다린 순)은 대기 컬럼이 시간 기준 내림차순(descending), 신뢰도는 none', async () => {
      renderPage();
      await waitForRows();

      expect(header(/^대기/)).toHaveAttribute('aria-sort', 'descending');
      expect(header(/^신뢰도/)).toHaveAttribute('aria-sort', 'none');
    });

    it('신뢰도 오름차순이면 신뢰도 ascending, 대기 none', async () => {
      renderPage(filtersOf({ sort: 'confidence', dir: 'asc' }));
      await waitForRows();

      expect(header(/^신뢰도/)).toHaveAttribute('aria-sort', 'ascending');
      expect(header(/^대기/)).toHaveAttribute('aria-sort', 'none');
    });

    it('신뢰도 내림차순이면 descending', async () => {
      renderPage(filtersOf({ sort: 'confidence', dir: 'desc' }));
      await waitForRows();

      expect(header(/^신뢰도/)).toHaveAttribute('aria-sort', 'descending');
    });

    it('대기 정렬 버튼에는 "답변 대기 건이 먼저 표시돼요" 설명이 있고 신뢰도 버튼에는 없다', async () => {
      renderPage();
      await waitForRows();

      expect(
        within(header(/^대기/)).getByRole('button'),
      ).toHaveAccessibleDescription(/답변 대기 건이 먼저 표시돼요/);
      expect(
        within(header(/^신뢰도/)).getByRole('button'),
      ).not.toHaveAccessibleDescription(/답변 대기 건이 먼저 표시돼요/);
    });

    it('정렬 불가 컬럼에는 aria-sort 가 없다', async () => {
      renderPage();
      await waitForRows();

      for (const name of [/^상태/, /^카테고리/, /^제목/, /^담당자/]) {
        expect(header(name)).not.toHaveAttribute('aria-sort');
      }
    });

    it('정렬 헤더는 버튼이고 정렬 불가 헤더에는 버튼이 없다', async () => {
      renderPage();
      await waitForRows();

      expect(within(header(/^대기/)).getByRole('button')).toBeInTheDocument();
      expect(within(header(/^신뢰도/)).getByRole('button')).toBeInTheDocument();
      expect(within(header(/^제목/)).queryByRole('button')).toBeNull();
    });

    it('현재 정렬 중인 대기를 누르면 방향이 뒤집힌다 (시간 오름차순 = sortDir desc)', async () => {
      renderPage();
      await waitForRows();

      fireEvent.click(within(header(/^대기/)).getByRole('button'));

      expect(lastReplacedFilters()).toMatchObject({
        sort: 'waiting',
        sortDir: 'desc',
        page: 1,
      });
    });

    it('다른 정렬에서 대기를 누르면 오래 기다린 순(waiting, asc)으로 돌아간다', async () => {
      renderPage(filtersOf({ sort: 'confidence', dir: 'desc' }));
      await waitForRows();

      fireEvent.click(within(header(/^대기/)).getByRole('button'));

      expect(lastReplacedFilters()).toMatchObject({
        sort: 'waiting',
        sortDir: 'asc',
      });
    });

    it('신뢰도를 처음 누르면 낮은 순(confidence, asc)이고 다시 누르면 desc 다', async () => {
      const { rerenderWith } = renderPage();
      await waitForRows();

      fireEvent.click(within(header(/^신뢰도/)).getByRole('button'));
      expect(lastReplacedFilters()).toMatchObject({
        sort: 'confidence',
        sortDir: 'asc',
        page: 1,
      });

      rerenderWith(filtersOf({ sort: 'confidence', dir: 'asc' }));
      fireEvent.click(within(header(/^신뢰도/)).getByRole('button'));
      expect(lastReplacedFilters()).toMatchObject({
        sort: 'confidence',
        sortDir: 'desc',
      });
    });

    it('정렬을 바꿔도 다른 필터와 페이지 크기는 유지하되 page 는 1 로 돌아간다', async () => {
      renderPage(filtersOf({ category: 'other', size: '50', page: '2' }));
      await waitForRows();

      fireEvent.click(within(header(/^신뢰도/)).getByRole('button'));

      expect(lastReplacedFilters()).toMatchObject({
        category: 'other',
        pageSize: 50,
        page: 1,
      });
    });

    it('정렬 버튼을 누른 뒤에도 포커스가 body 로 빠지지 않는다', async () => {
      const { rerenderWith } = renderPage();
      await waitForRows();
      const button = within(header(/^신뢰도/)).getByRole('button');
      button.focus();

      fireEvent.click(button);
      rerenderWith(filtersOf({ sort: 'confidence', dir: 'asc' }));

      expect(document.body).not.toHaveFocus();
    });
  });

  describe('페이징', () => {
    it('총 건수와 페이지 번호 버튼을 보여주고 현재 페이지만 aria-current="page" 다', async () => {
      respond([makeItem('a')], 45);
      renderPage(filtersOf({ page: '2' }));
      await waitForRows();

      const pager = screen.getByRole('navigation', { name: '페이지 이동' });

      expect(screen.getAllByText('총 45건').length).toBeGreaterThan(0);
      expect(within(pager).getByRole('button', { name: '2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        within(pager).getByRole('button', { name: '1' }),
      ).not.toHaveAttribute('aria-current');
      expect(
        within(pager).getByRole('button', { name: '3' }),
      ).not.toHaveAttribute('aria-current');
      expect(within(pager).queryByRole('button', { name: '4' })).toBeNull();
    });

    it('번호를 누르면 해당 page 로 replace 하고 나머지 필터는 유지한다', async () => {
      respond([makeItem('a')], 45);
      renderPage(filtersOf({ category: 'other' }));
      await waitForRows();

      fireEvent.click(screen.getByRole('button', { name: '3' }));

      expect(lastReplacedFilters()).toMatchObject({
        page: 3,
        category: 'other',
      });
    });

    it('이전/다음 버튼은 한 페이지씩 움직인다', async () => {
      respond([makeItem('a')], 45);
      renderPage(filtersOf({ page: '2' }));
      await waitForRows();

      fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
      expect(lastReplacedFilters().page).toBe(3);

      fireEvent.click(screen.getByRole('button', { name: '이전 페이지' }));
      expect(lastReplacedFilters().page).toBe(1);
    });

    it('첫 페이지의 이전 버튼은 aria-disabled 이고 포커스 가능하며 눌러도 이동하지 않는다', async () => {
      respond([makeItem('a')], 45);
      renderPage();
      await waitForRows();
      const prev = screen.getByRole('button', { name: '이전 페이지' });

      expect(prev).toHaveAttribute('aria-disabled', 'true');
      expect(prev).not.toBeDisabled();
      prev.focus();
      expect(prev).toHaveFocus();
      fireEvent.click(prev);

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('마지막 페이지의 다음 버튼도 마찬가지다', async () => {
      respond([makeItem('a')], 45);
      renderPage(filtersOf({ page: '3' }));
      await waitForRows();
      const next = screen.getByRole('button', { name: '다음 페이지' });

      expect(next).toHaveAttribute('aria-disabled', 'true');
      expect(next).not.toBeDisabled();
      fireEvent.click(next);

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('페이지당 개수 select 는 20/50/100 이고 현재 값이 선택돼 있다', async () => {
      renderPage(filtersOf({ size: '50' }));
      await waitForRows();
      const select = screen.getByRole('combobox', { name: '페이지당 개수' });

      expect(
        within(select)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['20개', '50개', '100개']);
      expect(select).toHaveDisplayValue('50개');
    });

    it('페이지당 개수를 바꾸면 pageSize 가 바뀌고 page 는 1 로 돌아간다', async () => {
      respond([makeItem('a')], 300);
      renderPage(filtersOf({ page: '4' }));
      await waitForRows();

      choose(screen.getByRole('combobox', { name: '페이지당 개수' }), '100개');

      expect(lastReplacedFilters()).toMatchObject({ pageSize: 100, page: 1 });
    });

    it('페이지를 눌러도 포커스가 body 로 빠지지 않는다', async () => {
      respond([makeItem('a')], 45);
      const { rerenderWith } = renderPage();
      await waitForRows();
      const button = screen.getByRole('button', { name: '2' });
      button.focus();

      fireEvent.click(button);
      rerenderWith(filtersOf({ page: '2' }));

      expect(document.body).not.toHaveFocus();
    });
  });

  describe('로딩', () => {
    it('첫 조회 중에는 표가 aria-busy 이고 데이터 행(링크)이 없다', async () => {
      vi.mocked(getAdminInquiries).mockReturnValue(
        new Promise(() => {}) as never,
      );
      renderPage();

      const table = tableRegion();

      expect(table).toHaveAttribute('aria-busy', 'true');
      expect(within(table).queryAllByRole('link')).toHaveLength(0);
      expect(within(table).getAllByRole('row').length).toBeGreaterThan(1);
    });

    it('조회가 끝나면 aria-busy 가 풀린다', async () => {
      renderPage();
      await waitForRows();

      expect(tableRegion()).not.toHaveAttribute('aria-busy', 'true');
    });

    it('필터가 바뀌어 다시 불러오는 동안에는 이전 행을 유지하고 표만 aria-busy 가 된다', async () => {
      let resolveSecond: (value: unknown) => void = () => {};
      vi.mocked(getAdminInquiries)
        .mockResolvedValueOnce({ items: [makeItem('a')], total: 1 } as never)
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveSecond = resolve;
          }) as never,
        );
      const { rerenderWith } = renderPage();
      await waitForRows();

      rerenderWith(filtersOf({ category: 'other' }));

      await waitFor(() =>
        expect(tableRegion()).toHaveAttribute('aria-busy', 'true'),
      );
      expect(screen.getByRole('link', { name: '제목 a' })).toBeInTheDocument();

      resolveSecond({ items: [makeItem('b')], total: 1 });

      expect(
        await screen.findByRole('link', { name: '제목 b' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: '제목 a' }),
      ).not.toBeInTheDocument();
      expect(tableRegion()).not.toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('결과 안내 (role="status")', () => {
    it('항상 마운트돼 있고 첫 조회 중에는 "불러오는 중" 이다', () => {
      vi.mocked(getAdminInquiries).mockReturnValue(
        new Promise(() => {}) as never,
      );
      renderPage();

      expect(statusRegion()).toHaveTextContent('불러오는 중');
    });

    it('조회가 끝나면 "문의 {total}건 · {page}/{totalPages}쪽 · {정렬}" 을 알린다', async () => {
      respond([makeItem('a')], 45);
      renderPage();

      await settledStatus(
        '문의 45건 · 1/3쪽 · 답변 대기 먼저 · 오래 기다린 순',
      );
    });

    it('현재 쪽과 페이지 크기가 반영된다 (totalPages = ceil(total/pageSize))', async () => {
      respond([makeItem('a')], 101);
      renderPage(filtersOf({ page: '2', size: '50' }));

      await settledStatus(
        '문의 101건 · 2/3쪽 · 답변 대기 먼저 · 오래 기다린 순',
      );
    });

    it('결과가 없으면 전체 쪽 수는 최소 1 이다', async () => {
      respond([], 0);
      renderPage();

      await settledStatus('문의 0건 · 1/1쪽 · 답변 대기 먼저 · 오래 기다린 순');
    });

    it.each([
      ['waiting', 'asc', '답변 대기 먼저 · 오래 기다린 순'],
      ['waiting', 'desc', '답변 대기 먼저 · 최근 대기 순'],
      ['confidence', 'asc', '신뢰도 낮은 순'],
      ['confidence', 'desc', '신뢰도 높은 순'],
      ['createdAt', 'asc', '접수 오래된 순'],
      ['createdAt', 'desc', '접수 최신 순'],
    ])('정렬 %s/%s 는 "%s" 로 알린다', async (sort, dir, label) => {
      respond([makeItem('a')], 3);
      renderPage(filtersOf({ sort, dir }));

      await settledStatus(`문의 3건 · 1/1쪽 · ${label}`);
    });

    it('필터가 바뀌어 다시 불러오는 동안에는 "불러오는 중" 이고 끝나면 새 결과를 알린다', async () => {
      let resolveSecond: (value: unknown) => void = () => {};
      vi.mocked(getAdminInquiries)
        .mockResolvedValueOnce({ items: [makeItem('a')], total: 1 } as never)
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveSecond = resolve;
          }) as never,
        );
      const { rerenderWith } = renderPage();
      await settledStatus('문의 1건 · 1/1쪽 · 답변 대기 먼저 · 오래 기다린 순');

      rerenderWith(filtersOf({ category: 'other' }));

      await waitFor(() =>
        expect(statusRegion()).toHaveTextContent('불러오는 중'),
      );

      resolveSecond({ items: [makeItem('b')], total: 2 });

      await settledStatus('문의 2건 · 1/1쪽 · 답변 대기 먼저 · 오래 기다린 순');
    });

    it('오류일 때는 비어 있다 (오류 안내는 alert 한 곳에서만)', async () => {
      vi.mocked(getAdminInquiries).mockRejectedValue(new Error('boom'));
      renderPage();

      await screen.findByRole('alert');

      expect(statusRegion().textContent?.trim()).toBe('');
    });
  });

  describe('빈 상태', () => {
    beforeEach(() => {
      respond([], 0);
    });

    it('안내 문구와 "필터 초기화" 버튼을 보이고 표/페이징은 숨긴다', async () => {
      renderPage(filtersOf({ category: 'other' }));

      expect(
        await screen.findByText('조건에 맞는 문의가 없어요.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '필터 초기화' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('"필터 초기화" 는 쿼리 없는 /admin/inquiries 로 replace 한다', async () => {
      renderPage(filtersOf({ category: 'other', q: '결제' }));
      fireEvent.click(
        await screen.findByRole('button', { name: '필터 초기화' }),
      );

      expect(router.replace).toHaveBeenCalledWith('/admin/inquiries');
    });

    it('초기화 후 화면이 바뀌어도 포커스가 body 로 빠지지 않는다', async () => {
      const { rerenderWith } = renderPage(filtersOf({ category: 'other' }));
      const reset = await screen.findByRole('button', { name: '필터 초기화' });
      reset.focus();
      fireEvent.click(reset);

      respond([makeItem('a')]);
      rerenderWith(filtersOf());
      await waitForRows();

      expect(document.body).not.toHaveFocus();
    });
  });

  describe('범위를 벗어난 페이지 (결과 0건 + page > 1)', () => {
    const OUT_OF_RANGE = { category: 'other', size: '50', page: '3' };

    const replacedOnce = async () => {
      await waitFor(() => expect(router.replace).toHaveBeenCalled());
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    };

    beforeEach(() => {
      respond([], 0);
    });

    it('빈 상태 문구와 "총 0건" 을 보이지 않는다', async () => {
      renderPage(filtersOf(OUT_OF_RANGE));
      await replacedOnce();

      expect(
        screen.queryByText('조건에 맞는 문의가 없어요.'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('총 0건')).not.toBeInTheDocument();
    });

    it('같은 필터에 page=1 만 바꿔 router.replace(scroll:false) 한다 (push 아님)', async () => {
      const filters = filtersOf(OUT_OF_RANGE);
      renderPage(filters);
      await replacedOnce();

      expect(lastReplacedFilters()).toEqual({ ...filters, page: 1 });
      expect(router.push).not.toHaveBeenCalled();
    });

    it('이동하는 동안 표는 aria-busy 이고 결과 안내(status)는 비어 있다', async () => {
      renderPage(filtersOf(OUT_OF_RANGE));
      await replacedOnce();

      expect(tableRegion()).toHaveAttribute('aria-busy', 'true');
      expect(statusRegion().textContent?.trim()).toBe('');
    });

    it('replace 는 한 번만 호출된다 (같은 filters 로 다시 렌더돼도 반복하지 않는다)', async () => {
      const { rerenderWith } = renderPage(filtersOf(OUT_OF_RANGE));
      await replacedOnce();

      rerenderWith(filtersOf(OUT_OF_RANGE));
      await replacedOnce();

      expect(router.replace).toHaveBeenCalledTimes(1);
    });

    it('page=1 로 바뀐 뒤에도 비어 있으면 다시 replace 하지 않고 빈 상태를 보인다 (무한 루프 방지)', async () => {
      const { rerenderWith } = renderPage(filtersOf(OUT_OF_RANGE));
      await replacedOnce();

      rerenderWith(filtersOf({ ...OUT_OF_RANGE, page: '1' }));

      expect(
        await screen.findByText('조건에 맞는 문의가 없어요.'),
      ).toBeInTheDocument();
      await settledStatus('문의 0건 · 1/1쪽 · 답변 대기 먼저 · 오래 기다린 순');
      expect(router.replace).toHaveBeenCalledTimes(1);
    });

    it('page=1 로 돌아와 실제 결과가 오면 그때 건수를 알리고 표를 보인다', async () => {
      const { rerenderWith } = renderPage(filtersOf(OUT_OF_RANGE));
      await replacedOnce();
      expect(statusRegion().textContent?.trim()).toBe('');

      respond([makeItem('a')], 7);
      rerenderWith(filtersOf({ ...OUT_OF_RANGE, page: '1' }));

      expect(await waitForRows()).toBeInTheDocument();
      await settledStatus('문의 7건 · 1/1쪽 · 답변 대기 먼저 · 오래 기다린 순');
    });

    it('page=1 에서 결과가 비면 replace 없이 기존 빈 상태를 보인다', async () => {
      renderPage(filtersOf({ category: 'other' }));

      expect(
        await screen.findByText('조건에 맞는 문의가 없어요.'),
      ).toBeInTheDocument();
      await settledStatus('문의 0건 · 1/1쪽 · 답변 대기 먼저 · 오래 기다린 순');
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('page>1 이어도 결과가 있으면 replace 하지 않는다', async () => {
      respond([makeItem('a')], 45);
      renderPage(filtersOf({ page: '2' }));
      await waitForRows();

      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('오류 상태', () => {
    it('오류 문구를 alert 하나로만 알리고 "다시 시도" 버튼을 둔다', async () => {
      vi.mocked(getAdminInquiries).mockRejectedValue(new Error('boom'));
      renderPage();

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent(
        '문의 목록을 불러오지 못했어요. 다시 시도해주세요.',
      );
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(
        screen.getByRole('button', { name: '다시 시도' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('"다시 시도" 는 같은 필터로 다시 조회하고 성공하면 목록을 보여준다', async () => {
      vi.mocked(getAdminInquiries)
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ items: [makeItem('a')], total: 1 } as never);
      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));

      expect(
        await screen.findByRole('link', { name: '제목 a' }),
      ).toBeInTheDocument();
      expect(getAdminInquiries).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('재시도 후에도 포커스가 body 로 빠지지 않는다', async () => {
      vi.mocked(getAdminInquiries)
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ items: [makeItem('a')], total: 1 } as never);
      renderPage();
      const retry = await screen.findByRole('button', { name: '다시 시도' });
      retry.focus();

      fireEvent.click(retry);
      await waitForRows();

      expect(document.body).not.toHaveFocus();
    });

    it('다시 실패하면 오류 안내는 여전히 하나뿐이다', async () => {
      vi.mocked(getAdminInquiries).mockRejectedValue(new Error('boom'));
      renderPage();

      fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));

      await waitFor(() => expect(getAdminInquiries).toHaveBeenCalledTimes(2));
      expect(await screen.findAllByRole('alert')).toHaveLength(1);
    });
  });

  describe('연속 변경 누적 (filters prop 은 서버 왕복 뒤에야 갱신된다)', () => {
    it('상태를 연달아 두 번 바꾸면 마지막 replace 에 둘 다 담긴다', async () => {
      renderPage();
      await waitForRows();

      fireEvent.click(screen.getByLabelText('답변 완료'));
      fireEvent.click(screen.getByLabelText('종결'));

      expect(lastReplacedFilters().statuses).toEqual([
        'waiting',
        'in_progress',
        'answered',
        'closed',
      ]);
    });

    it('카테고리를 바꾼 직후 상태를 바꿔도 카테고리 변경이 유지된다', async () => {
      renderPage();
      await waitForRows();

      choose(
        screen.getByRole('combobox', { name: '카테고리' }),
        INQUIRY_CATEGORY_LABELS.bug_report,
      );
      fireEvent.click(screen.getByLabelText('답변 완료'));

      expect(lastReplacedFilters()).toMatchObject({
        category: 'bug_report',
        statuses: ['waiting', 'in_progress', 'answered'],
      });
    });

    it('카테고리를 바꾼 직후 "미분류만" 을 켜면 둘 다 반영된다 (미분류만 켜짐, 카테고리는 해제)', async () => {
      renderPage();
      await waitForRows();

      choose(
        screen.getByRole('combobox', { name: '카테고리' }),
        INQUIRY_CATEGORY_LABELS.bug_report,
      );
      fireEvent.click(screen.getByRole('button', { name: '미분류만' }));

      expect(lastReplacedFilters()).toMatchObject({
        uncategorizedOnly: true,
        category: null,
      });
    });

    it('기간을 바꾼 직후 정렬을 바꿔도 기간이 유지된다', async () => {
      renderPage();
      await waitForRows();

      choose(screen.getByRole('combobox', { name: '기간' }), '최근 7일');
      fireEvent.click(
        within(screen.getByRole('columnheader', { name: /^신뢰도/ })).getByRole(
          'button',
        ),
      );

      expect(lastReplacedFilters()).toMatchObject({
        periodDays: 7,
        sort: 'confidence',
        sortDir: 'asc',
      });
    });

    it('상태를 바꾼 뒤 키워드 디바운스가 발화해도 상태 변경이 유지된다', async () => {
      renderPage();
      await waitForRows();

      fireEvent.change(keywordInput(), { target: { value: '결제' } });
      fireEvent.click(screen.getByLabelText('답변 완료'));
      const afterStatus = router.replace.mock.calls.length;

      await waitUntilReplaced(afterStatus + 1);

      expect(lastReplacedFilters()).toMatchObject({
        keyword: '결제',
        statuses: ['waiting', 'in_progress', 'answered'],
      });
    });

    it('새 filters prop 이 도착하면 그 값을 기준으로 이어서 바꾼다 (오래된 누적값을 쓰지 않는다)', async () => {
      const { rerenderWith } = renderPage();
      await waitForRows();

      fireEvent.click(screen.getByLabelText('답변 완료'));
      rerenderWith(filtersOf({ status: 'answered' }));

      expect(screen.getByLabelText('답변 완료')).toBeChecked();
      expect(screen.getByLabelText('답변 대기')).not.toBeChecked();

      fireEvent.click(screen.getByLabelText('종결'));

      expect(lastReplacedFilters().statuses).toEqual(['answered', 'closed']);
    });
  });

  describe('키워드 입력 보강', () => {
    it('보낸 검색어를 기준으로 비교한다: 보낸 뒤 prop 이 돌아오기 전에 지우면 비운 값도 보낸다', async () => {
      renderPage();
      await waitForRows();

      fireEvent.change(keywordInput(), { target: { value: 'ab' } });
      await waitUntilReplaced(1);
      expect(
        filtersFromUrl(router.replace.mock.calls[0][0] as string).keyword,
      ).toBe('ab');

      fireEvent.change(keywordInput(), { target: { value: '' } });
      await waitUntilReplaced(2);

      expect(lastReplacedFilters().keyword).toBe('');
    });

    it('늦게 도착한 이전 검색어 prop 이 입력창을 되돌리지 않는다 (사용자가 친 값과 일치)', async () => {
      const { rerenderWith } = renderPage();
      await waitForRows();

      fireEvent.change(keywordInput(), { target: { value: 'ab' } });
      await waitUntilReplaced(1);
      fireEvent.change(keywordInput(), { target: { value: '' } });
      await waitUntilReplaced(2);

      rerenderWith(filtersOf({ q: 'ab' }));

      expect(keywordInput()).toHaveValue('');
    });

    it('1자만 입력하면 "2자 이상 입력하면 검색해요" 안내가 입력창에 연결된다', async () => {
      renderPage();
      await waitForRows();

      fireEvent.change(keywordInput(), { target: { value: '앱' } });

      expect(screen.getByText('2자 이상 입력하면 검색해요')).toBeVisible();
      expect(keywordInput()).toHaveAccessibleDescription(
        '2자 이상 입력하면 검색해요',
      );
    });

    it('1자 상태에서 Enter 를 눌러도 안내가 유지되고 replace 는 보내지 않는다', async () => {
      renderPage();
      await waitForRows();

      fireEvent.change(keywordInput(), { target: { value: '앱' } });
      fireEvent.keyDown(keywordInput(), { key: 'Enter' });

      expect(keywordInput()).toHaveAccessibleDescription(
        '2자 이상 입력하면 검색해요',
      );
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('2자 이상이면 안내는 입력창 설명에 포함되지 않는다', async () => {
      renderPage();
      await waitForRows();

      fireEvent.change(keywordInput(), { target: { value: '앱이' } });

      expect(describedText(keywordInput())).not.toContain('2자 이상');
    });

    it('"검색어 지우기" 버튼은 입력이 있을 때만 나타난다', async () => {
      renderPage();
      await waitForRows();

      expect(
        screen.queryByRole('button', { name: '검색어 지우기' }),
      ).not.toBeInTheDocument();

      fireEvent.change(keywordInput(), { target: { value: '앱' } });

      expect(
        screen.getByRole('button', { name: '검색어 지우기' }),
      ).toBeInTheDocument();
    });

    it('"검색어 지우기" 는 입력을 비우고 즉시 q 없이 적용하며 포커스를 입력창으로 돌린다', async () => {
      renderPage(filtersOf({ q: '결제' }));
      await waitForRows();

      fireEvent.click(screen.getByRole('button', { name: '검색어 지우기' }));

      expect(keywordInput()).toHaveValue('');
      expect(lastReplacedFilters().keyword).toBe('');
      expect(keywordInput()).toHaveFocus();
    });
  });

  describe('마지막 상태 체크박스', () => {
    const HINT = '상태는 최소 1개 선택돼 있어야 해요';

    it('하나만 남으면 disabled 가 아니라 aria-disabled="true" 이고 포커스를 받는다', async () => {
      renderPage(filtersOf({ status: 'answered' }));
      await waitForRows();
      const last = screen.getByLabelText('답변 완료');

      expect(last).toHaveAttribute('aria-disabled', 'true');
      expect(last).not.toBeDisabled();
      last.focus();
      expect(last).toHaveFocus();
    });

    it('눌러도 아무 일도 일어나지 않는다', async () => {
      renderPage(filtersOf({ status: 'answered' }));
      await waitForRows();

      fireEvent.click(screen.getByLabelText('답변 완료'));

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('안내는 기본으로 숨겨져 있고(data-revealed="false") 체크박스의 설명으로 연결된다', async () => {
      renderPage(filtersOf({ status: 'answered' }));
      await waitForRows();
      const last = screen.getByLabelText('답변 완료');

      expect(screen.getByText(HINT)).toHaveAttribute('data-revealed', 'false');
      expect(describedText(last)).toContain(HINT);
    });

    it('마지막 상태를 끄려고 시도하면 안내가 드러나고(data-revealed="true") 여전히 포커스·연결을 유지한다', async () => {
      renderPage(filtersOf({ status: 'answered' }));
      await waitForRows();
      const last = screen.getByLabelText('답변 완료');
      last.focus();

      fireEvent.click(last);

      expect(screen.getByText(HINT)).toHaveAttribute('data-revealed', 'true');
      expect(describedText(last)).toContain(HINT);
      expect(last).toHaveFocus();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('선택된 상태가 바뀌면 안내는 다시 숨겨지고 여러 개면 어느 체크박스에도 연결되지 않는다', async () => {
      const { rerenderWith } = renderPage(filtersOf({ status: 'answered' }));
      await waitForRows();
      fireEvent.click(screen.getByLabelText('답변 완료'));
      expect(screen.getByText(HINT)).toHaveAttribute('data-revealed', 'true');

      rerenderWith(filtersOf({ status: 'answered,closed' }));

      for (const label of ['답변 완료', '종결']) {
        expect(describedText(screen.getByLabelText(label))).not.toContain(HINT);
      }
      const hint = screen.queryByText(HINT);

      if (hint) expect(hint).toHaveAttribute('data-revealed', 'false');
    });

    it('다른 상태 하나로 바뀐 단일 선택도 숨겨진 상태로 시작한다', async () => {
      const { rerenderWith } = renderPage(filtersOf({ status: 'answered' }));
      await waitForRows();
      fireEvent.click(screen.getByLabelText('답변 완료'));

      rerenderWith(filtersOf({ status: 'closed' }));

      expect(screen.getByText(HINT)).toHaveAttribute('data-revealed', 'false');
      expect(describedText(screen.getByLabelText('종결'))).toContain(HINT);
    });

    it('filters prop 이 바뀌면(같은 단일 상태여도) 드러난 안내는 다시 숨겨진다', async () => {
      const { rerenderWith } = renderPage(filtersOf({ status: 'answered' }));
      await waitForRows();
      fireEvent.click(screen.getByLabelText('답변 완료'));
      expect(screen.getByText(HINT)).toHaveAttribute('data-revealed', 'true');

      rerenderWith(filtersOf({ status: 'answered', category: 'other' }));

      expect(screen.getByText(HINT)).toHaveAttribute('data-revealed', 'false');
    });

    it('나머지(체크 안 된) 체크박스는 aria-disabled 가 아니고 켤 수 있다', async () => {
      renderPage(filtersOf({ status: 'answered' }));
      await waitForRows();
      const other = screen.getByLabelText('종결');

      expect(other).not.toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(other);

      expect(lastReplacedFilters().statuses).toEqual(['answered', 'closed']);
    });

    it('둘 이상 체크돼 있으면 어느 것도 aria-disabled 가 아니다', async () => {
      renderPage();
      await waitForRows();

      for (const label of ['답변 대기', '처리 중']) {
        expect(screen.getByLabelText(label)).not.toHaveAttribute(
          'aria-disabled',
          'true',
        );
      }
    });
  });

  describe('카테고리와 "미분류만"', () => {
    const NOTE = '미분류만 보는 중이라 카테고리는 고를 수 없어요';

    it('미분류만이 켜져 있으면 카테고리 select 는 aria-disabled="true" 이고 포커스를 받는다', async () => {
      renderPage(filtersOf({ uncategorized: '1' }));
      await waitForRows();
      const select = screen.getByRole('combobox', { name: '카테고리' });

      expect(select).toHaveAttribute('aria-disabled', 'true');
      expect(select).not.toBeDisabled();
      select.focus();
      expect(select).toHaveFocus();
    });

    it('이때의 카테고리 변경은 무시한다', async () => {
      renderPage(filtersOf({ uncategorized: '1' }));
      await waitForRows();

      choose(
        screen.getByRole('combobox', { name: '카테고리' }),
        INQUIRY_CATEGORY_LABELS.other,
      );

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('안내 문구가 보이고 select 의 설명으로 연결된다', async () => {
      renderPage(filtersOf({ uncategorized: '1' }));
      await waitForRows();

      expect(screen.getByText(NOTE)).toBeVisible();
      expect(
        screen.getByRole('combobox', { name: '카테고리' }),
      ).toHaveAccessibleDescription(NOTE);
    });

    it('미분류만이 꺼져 있으면 select 는 활성이고 변경이 반영된다', async () => {
      renderPage();
      await waitForRows();
      const select = screen.getByRole('combobox', { name: '카테고리' });

      expect(select).not.toHaveAttribute('aria-disabled', 'true');
      expect(describedText(select)).not.toContain(NOTE);
      choose(select, INQUIRY_CATEGORY_LABELS.other);

      expect(lastReplacedFilters().category).toBe('other');
    });

    it('미분류만을 끄면 다시 활성화된다', async () => {
      const { rerenderWith } = renderPage(filtersOf({ uncategorized: '1' }));
      await waitForRows();

      fireEvent.click(screen.getByRole('button', { name: '미분류만' }));
      rerenderWith(filtersOf());

      const select = screen.getByRole('combobox', { name: '카테고리' });

      expect(select).not.toHaveAttribute('aria-disabled', 'true');
      choose(select, INQUIRY_CATEGORY_LABELS.other);
      expect(lastReplacedFilters().category).toBe('other');
    });
  });

  describe('헤더와 초기화 버튼', () => {
    it('조회가 끝나면 h1 옆에 보이는 "총 {total}건" 을 보여준다 (페이저의 총 건수와 별개)', async () => {
      respond([makeItem('a')], 45);
      renderPage();
      await waitForRows();

      const pager = screen.getByRole('navigation', { name: '페이지 이동' });
      const outsidePager = screen
        .getAllByText('총 45건')
        .filter((element) => !pager.contains(element));

      expect(outsidePager).toHaveLength(1);
      expect(outsidePager[0]).toBeVisible();
      expect(statusRegion()).toBeInTheDocument();
    });

    it('조회 중에는 "총 N건" 을 보이지 않는다', () => {
      vi.mocked(getAdminInquiries).mockReturnValue(
        new Promise(() => {}) as never,
      );
      renderPage();

      expect(screen.queryByText(/^총 \d+건$/)).not.toBeInTheDocument();
    });

    it('"초기화" 버튼은 기본 필터일 때 aria-disabled="true" 이고 눌러도 이동하지 않는다', async () => {
      renderPage();
      await waitForRows();

      expect(resetButton()).toHaveAttribute('aria-disabled', 'true');
      expect(resetButton()).not.toBeDisabled();
      fireEvent.click(resetButton());

      expect(router.replace).not.toHaveBeenCalled();
    });

    it.each([
      ['카테고리', { category: 'other' }],
      ['상태', { status: 'answered' }],
      ['검색어', { q: '결제' }],
      ['미분류만', { uncategorized: '1' }],
      ['명시한 기간', { period: '30' }],
    ])(
      '%s 가 기본이 아니면 활성이고 누르면 /admin/inquiries 로 replace 한다',
      async (_name, query) => {
        renderPage(filtersOf(query));
        await waitForRows();

        expect(resetButton()).not.toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(resetButton());

        expect(router.replace).toHaveBeenCalledWith('/admin/inquiries');
      },
    );

    it('초기화 뒤에도 포커스가 body 로 빠지지 않는다', async () => {
      const { rerenderWith } = renderPage(filtersOf({ category: 'other' }));
      await waitForRows();
      resetButton().focus();

      fireEvent.click(resetButton());
      expect(document.body).not.toHaveFocus();

      rerenderWith(filtersOf());
      await waitForRows();

      expect(document.body).not.toHaveFocus();
    });
  });

  describe('다시 불러오는 동안의 표 (stale)', () => {
    const staleHost = () => tableRegion().closest('[data-stale="true"]');

    it('이전 데이터를 유지한 채 다시 불러오는 동안 data-stale 과 aria-busy 를 가진다', async () => {
      let resolveSecond: (value: unknown) => void = () => {};
      vi.mocked(getAdminInquiries)
        .mockResolvedValueOnce({ items: [makeItem('a')], total: 1 } as never)
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveSecond = resolve;
          }) as never,
        );
      const { rerenderWith } = renderPage();
      await waitForRows();
      expect(staleHost()).toBeNull();

      rerenderWith(filtersOf({ category: 'other' }));

      await waitFor(() => expect(staleHost()).not.toBeNull());
      expect(tableRegion()).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('link', { name: '제목 a' })).toBeInTheDocument();

      resolveSecond({ items: [makeItem('b')], total: 1 });
      await screen.findByRole('link', { name: '제목 b' });

      expect(staleHost()).toBeNull();
    });

    it('첫 로딩(뼈대 행)에는 data-stale 이 없다', () => {
      vi.mocked(getAdminInquiries).mockReturnValue(
        new Promise(() => {}) as never,
      );
      renderPage();

      expect(staleHost()).toBeNull();
      expect(tableRegion()).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('빈 상태 (기본 필터)', () => {
    beforeEach(() => {
      respond([], 0);
    });

    it('기본 필터에서는 "지금 처리할 문의가 없어요." 와 "최근 답변 완료 보기" 를 보인다', async () => {
      renderPage();

      expect(
        await screen.findByText('지금 처리할 문의가 없어요.'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('조건에 맞는 문의가 없어요.'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '최근 답변 완료 보기' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('"최근 답변 완료 보기" 는 답변 완료만, 그 상태의 기본 기간으로 replace 한다', async () => {
      renderPage();

      fireEvent.click(
        await screen.findByRole('button', { name: '최근 답변 완료 보기' }),
      );

      const filters = lastReplacedFilters();

      expect(filters.statuses).toEqual(['answered']);
      expect(filters).toEqual(filtersOf({ status: 'answered' }));
    });

    it.each([
      ['카테고리', { category: 'other' }],
      ['검색어', { q: '결제' }],
      ['미분류만', { uncategorized: '1' }],
      ['상태', { status: 'waiting' }],
      ['명시한 기간', { period: '30' }],
    ])(
      '%s 가 기본이 아니면 기존 문구와 "필터 초기화" 를 보인다',
      async (_name, query) => {
        renderPage(filtersOf(query));

        expect(
          await screen.findByText('조건에 맞는 문의가 없어요.'),
        ).toBeInTheDocument();
        expect(
          screen.queryByText('지금 처리할 문의가 없어요.'),
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: '필터 초기화' }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: '최근 답변 완료 보기' }),
        ).not.toBeInTheDocument();
      },
    );
  });

  describe('범위를 벗어난 페이지 안내 토스트', () => {
    const MESSAGE = '마지막 페이지가 없어 1쪽으로 이동했어요';
    const original = useToast.getState().showToast;
    const showToast = vi.fn();

    beforeEach(() => {
      showToast.mockReset();
      useToast.setState({ showToast });
      respond([], 0);
    });

    afterEach(() => {
      useToast.setState({ showToast: original });
    });

    it('1쪽으로 보내면서 토스트를 한 번 띄운다', async () => {
      const { rerenderWith } = renderPage(
        filtersOf({ category: 'other', page: '3' }),
      );

      await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
      expect(showToast.mock.calls[0][0]).toBe(MESSAGE);

      // 같은 filters 로 다시 그려져도, 1쪽으로 이동해도 반복하지 않는다.
      rerenderWith(filtersOf({ category: 'other', page: '3' }));
      rerenderWith(filtersOf({ category: 'other' }));
      await screen.findByText('조건에 맞는 문의가 없어요.');

      expect(showToast).toHaveBeenCalledTimes(1);
    });

    it('범위 안의 빈 결과(1쪽)에서는 띄우지 않는다', async () => {
      renderPage(filtersOf({ category: 'other' }));

      await screen.findByText('조건에 맞는 문의가 없어요.');

      expect(showToast).not.toHaveBeenCalled();
    });
  });

  describe('오류 문구 구분', () => {
    const AUTH_COPY = '권한이 없거나 로그인이 만료됐어요. 다시 로그인해주세요.';
    const GENERIC = '문의 목록을 불러오지 못했어요. 다시 시도해주세요.';

    it.each([
      ['message 에 forbidden', new Error('forbidden')],
      ['message 에 unauthorized', new Error('unauthorized')],
      [
        'code 에 forbidden',
        Object.assign(new Error('x'), { code: 'forbidden' }),
      ],
      ['code 에 unauthorized', { code: 'unauthorized', message: 'x' }],
    ])(
      '%s 가 들어 있으면 권한/로그인 안내를 보이고 다시 시도 버튼도 둔다',
      async (_name, error) => {
        vi.mocked(getAdminInquiries).mockRejectedValue(error);
        renderPage();

        const alert = await screen.findByRole('alert');

        expect(alert).toHaveTextContent(AUTH_COPY);
        expect(alert).not.toHaveTextContent('불러오지 못했어요');
        expect(
          screen.getByRole('button', { name: '다시 시도' }),
        ).toBeInTheDocument();
      },
    );

    it('그 밖의 오류는 기존 문구를 보인다', async () => {
      vi.mocked(getAdminInquiries).mockRejectedValue({
        code: '57014',
        message: 'statement timeout',
      });
      renderPage();

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent(GENERIC);
      expect(alert).not.toHaveTextContent('로그인');
    });
  });
});
