import type { ReactNode } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminInquiry, openAdminInquiry } from '@/entities/admin';
import { adminQueryKeys } from '@/features/adminInquiry';
import { useToast } from '@/shared/ui';

import {
  INQUIRY_ID,
  NOW,
  QUESTION,
  assigneeSelect,
  changeServerInquiry,
  choose,
  createClient,
  createServer,
  deferred,
  flush,
  header,
  installCurrentUser,
  installScrollSpy,
  installServer,
  makeInquiry,
  renderPage,
  statusSaveButton,
  statusText,
  visibleLabels,
  waitForIdle,
  waitForPage,
  waitForStatus,
  type Server,
} from './testUtils';

const safeBack = vi.hoisted(() => ({ goBack: vi.fn(), useSafeBack: vi.fn() }));

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
  usePathname: () => '/admin/inquiries/inq-1',
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

vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSafeBack: safeBack.useSafeBack,
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createBrowserClient: () => ({ __supabase: true }),
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  addAdminMemo: vi.fn(),
  closeAdminInquiry: vi.fn(),
  getAdminInquiries: vi.fn(),
  getAdminInquiry: vi.fn(),
  getAdminInquiryMessages: vi.fn(),
  getAdminList: vi.fn(),
  getAdminPendingCount: vi.fn(),
  getAdminUserRecentInquiries: vi.fn(),
  openAdminInquiry: vi.fn(),
  replyAdminInquiry: vi.fn(),
  updateAdminInquiryMeta: vi.fn(),
}));

vi.mock('@/entities/auth', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getCachedUser: vi.fn(),
}));

vi.mock('@/entities/inquiry', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  deleteInquiryAttachments: vi.fn(),
  getAttachmentUrls: vi.fn(),
  uploadInquiryAttachment: vi.fn(),
}));

const PEEK_NOTE = '미리보기로 열었어요. 담당자는 지정되지 않았어요.';
const PEEK_HINT = '담당하려면 "상태·담당자" 영역에서 지정하세요.';
const OPEN_FAILURE_NOTE =
  '담당자 지정에 실패했어요. 담당자에서 직접 지정하세요.';
const CLAIM_ANNOUNCEMENT = '처리 중으로 바꾸고 내가 담당했어요';

let server: Server;

const WAITING = {
  status: 'waiting',
  assigneeId: null,
  assigneeEmail: null,
} as const;

const useServer = (
  inquiry: NonNullable<Parameters<typeof createServer>[0]>['inquiry'],
) => {
  server = createServer({ inquiry });
  installServer(server);
};

/** 화면이 보여 줄 낡은 캐시를 미리 채운 QueryClient. */
const seededClient = (inquiry: ReturnType<typeof makeInquiry>) => {
  const client = createClient();

  // 낡은 캐시가 있는 쿼리의 재시도(retry: 1)가 기본 지연(~1초)으로 waitFor 의 기본 제한과 겹치지 않게 한다.
  client.setDefaultOptions({
    queries: { retry: false, retryDelay: 0 },
    mutations: { retry: false },
  });
  client.setQueryData(adminQueryKeys.inquiry(INQUIRY_ID), inquiry);
  client.setQueryData(adminQueryKeys.messages(INQUIRY_ID), [QUESTION]);

  return client;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  safeBack.useSafeBack.mockImplementation(() => safeBack.goBack);
  act(() => useToast.setState({ message: null, tone: 'default' }));
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  installScrollSpy();
  server = createServer();
  installServer(server);
  installCurrentUser();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('열기 - 마운트 뒤 새로 받은 결과로만 결정한다', () => {
  it('낡은 캐시의 "답변 대기" 로는 열지 않는다 (서버는 이미 처리 중이다)', async () => {
    useServer({ status: 'in_progress' });
    const client = seededClient(makeInquiry(WAITING));
    const gate = deferred<ReturnType<typeof makeInquiry>>();
    vi.mocked(getAdminInquiry).mockReturnValue(gate.promise as never);

    renderPage({ client });
    await waitForPage();
    await flush();

    // 낡은 캐시가 실제로 그려져 있는 동안에도 열지 않는다.
    expect(visibleLabels('답변 대기').length).toBeGreaterThan(0);
    expect(openAdminInquiry).not.toHaveBeenCalled();

    gate.resolve(makeInquiry({ status: 'in_progress' }));
    await waitFor(() =>
      expect(visibleLabels('처리 중').length).toBeGreaterThan(0),
    );
    await waitForIdle(client);

    expect(openAdminInquiry).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    '낡은 캐시가 "처리 중" 이어도 새로 받은 결과가 "답변 대기" 면 정확히 한 번 연다 (strict=%s)',
    async (strict) => {
      useServer(WAITING);
      const client = seededClient(makeInquiry({ status: 'in_progress' }));

      renderPage({ client, strict });
      await waitForPage();

      await waitFor(() => expect(openAdminInquiry).toHaveBeenCalled());
      await waitForIdle(client);
      expect(openAdminInquiry).toHaveBeenCalledTimes(1);
    },
  );

  it.each([false, true])(
    '낡은 캐시도 새 결과도 "답변 대기" 면 새 결과가 도착한 뒤에야 한 번 연다 (strict=%s)',
    async (strict) => {
      useServer(WAITING);
      const client = seededClient(makeInquiry(WAITING));
      const gate = deferred<ReturnType<typeof makeInquiry>>();
      vi.mocked(getAdminInquiry).mockReturnValueOnce(gate.promise as never);

      renderPage({ client, strict });
      await waitForPage();
      await flush();

      expect(openAdminInquiry).not.toHaveBeenCalled();

      gate.resolve(makeInquiry(WAITING));

      await waitFor(() => expect(openAdminInquiry).toHaveBeenCalledTimes(1));
      await waitForIdle(client);
      expect(openAdminInquiry).toHaveBeenCalledTimes(1);
    },
  );

  it('새 결과가 오류면 낡은 캐시의 "답변 대기" 로 열지 않는다', async () => {
    useServer(WAITING);
    const client = seededClient(makeInquiry(WAITING));
    vi.mocked(getAdminInquiry).mockRejectedValue(new Error('boom'));

    renderPage({ client });
    await waitForPage();
    // 재시도까지 마친 뒤(최초 + 재시도 1회) 가라앉은 상태에서 확인한다.
    await waitFor(
      () =>
        expect(
          vi.mocked(getAdminInquiry).mock.calls.length,
        ).toBeGreaterThanOrEqual(2),
      { timeout: 5000 },
    );
    await waitForIdle(client, 5000);

    expect(openAdminInquiry).not.toHaveBeenCalled();
  }, 15_000);
});

describe('열기 - 미리보기(peek) 모드', () => {
  it.each([false, true])(
    '"답변 대기" 문의여도 열기 요청을 절대 보내지 않고 상태·담당자는 그대로다 (strict=%s)',
    async (strict) => {
      useServer(WAITING);
      const { client } = renderPage({ peek: true, strict });
      await waitForPage();
      await waitForIdle(client);
      await flush();

      expect(openAdminInquiry).not.toHaveBeenCalled();
      expect(visibleLabels('답변 대기').length).toBeGreaterThan(0);
      expect(visibleLabels('처리 중')).toHaveLength(0);
      expect(statusText()).toBe('');
    },
  );

  it('"미리보기로 열었어요. 담당자는 지정되지 않았어요." 를 평문으로 보인다 (알림 영역이 아니다)', async () => {
    useServer(WAITING);
    const { client } = renderPage({ peek: true });
    await waitForPage();
    await waitForIdle(client);

    const note = screen.getByText(PEEK_NOTE);

    expect(note).toBeVisible();
    expect(note.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('미리보기가 아니면 안내는 없고 답변 대기 문의를 연다', async () => {
    useServer(WAITING);
    const { client } = renderPage({ peek: false });
    await waitForPage();
    await waitFor(() => expect(openAdminInquiry).toHaveBeenCalledTimes(1));
    await waitForIdle(client);

    expect(screen.queryByText(PEEK_NOTE)).not.toBeInTheDocument();
  });

  it('peek 를 넘기지 않아도(기본) 안내는 없다', async () => {
    useServer({ status: 'in_progress' });
    const { client } = renderPage();
    await waitForPage();
    await waitForIdle(client);

    expect(screen.queryByText(PEEK_NOTE)).not.toBeInTheDocument();
  });
});

describe('열기 - 미리보기 안내 (답변 대기 + 담당자 없음일 때만)', () => {
  const NOTES = [PEEK_NOTE, PEEK_HINT];

  const waitForOperatorOptions = () =>
    waitFor(() =>
      expect(
        within(assigneeSelect()).getByRole('option', { name: 'opa@moa.test' }),
      ).toBeInTheDocument(),
    );

  it('두 안내를 각각 별도의 평문 요소로 보이고 힌트가 아래에 있다', async () => {
    useServer(WAITING);
    const { client } = renderPage({ peek: true });
    await waitForPage();
    await waitForIdle(client);

    const note = screen.getByText(PEEK_NOTE);
    const hint = screen.getByText(PEEK_HINT);

    expect(hint).toBeVisible();
    expect(hint).not.toBe(note);
    expect(note.contains(hint)).toBe(false);
    expect(hint.contains(note)).toBe(false);
    expect(
      Boolean(
        note.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);

    NOTES.forEach((text) =>
      expect(
        screen.getByText(text).closest('[role="status"], [role="alert"]'),
      ).toBeNull(),
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(statusText()).toBe('');
  });

  it('이미 다른 운영자가 담당 중이면 (답변 대기여도) 둘 다 숨긴다', async () => {
    useServer({
      status: 'waiting',
      assigneeId: 'op-1',
      assigneeEmail: 'opa@moa.test',
    });
    const { client } = renderPage({ peek: true });
    await waitForPage();
    await waitForIdle(client);

    NOTES.forEach((text) =>
      expect(screen.queryByText(text)).not.toBeInTheDocument(),
    );
  });

  it('처리 중이면 담당자가 없어도 둘 다 숨긴다', async () => {
    useServer({
      status: 'in_progress',
      assigneeId: null,
      assigneeEmail: null,
    });
    const { client } = renderPage({ peek: true });
    await waitForPage();
    await waitForIdle(client);

    NOTES.forEach((text) =>
      expect(screen.queryByText(text)).not.toBeInTheDocument(),
    );
  });

  it('미리보기가 아니면 둘 다 없다', async () => {
    useServer(WAITING);
    const { client } = renderPage({ peek: false });
    await waitForPage();
    await waitFor(() => expect(openAdminInquiry).toHaveBeenCalledTimes(1));
    await waitForIdle(client);

    NOTES.forEach((text) =>
      expect(screen.queryByText(text)).not.toBeInTheDocument(),
    );
  });

  it('패널에서 담당자를 지정하면 (여전히 답변 대기라도) 둘 다 사라진다', async () => {
    useServer(WAITING);
    const { client } = renderPage({ peek: true });
    await waitForPage();
    await waitForIdle(client);
    await waitForOperatorOptions();
    expect(screen.getByText(PEEK_HINT)).toBeVisible();

    choose(assigneeSelect(), 'opa@moa.test');
    fireEvent.click(statusSaveButton());

    await waitFor(() =>
      expect(screen.queryByText(PEEK_NOTE)).not.toBeInTheDocument(),
    );
    await waitForIdle(client);
    expect(screen.queryByText(PEEK_HINT)).not.toBeInTheDocument();
    expect(visibleLabels('답변 대기').length).toBeGreaterThan(0);
  });
});

describe('열기 - 자동 담당 지정이 눈에 보인다', () => {
  it('열기에 성공하면 "처리 중으로 바꾸고 내가 담당했어요" 를 한 번 알린다', async () => {
    useServer(WAITING);
    const { client } = renderPage();
    await waitForPage();

    await waitForStatus(CLAIM_ANNOUNCEMENT);
    await waitForIdle(client);

    expect(statusText()).toBe(CLAIM_ANNOUNCEMENT);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(openAdminInquiry).toHaveBeenCalledTimes(1);
  });

  it('이후 다시 불러와도 같은 알림이 그대로고 다른 알림이 끼어들지 않는다', async () => {
    useServer(WAITING);
    const { client } = renderPage();
    await waitForPage();
    await waitForStatus(CLAIM_ANNOUNCEMENT);
    await waitForIdle(client);

    await act(async () => {
      await client.invalidateQueries({
        queryKey: adminQueryKeys.inquiry(INQUIRY_ID),
      });
    });
    await waitForIdle(client);

    expect(statusText()).toBe(CLAIM_ANNOUNCEMENT);
  });

  it('열 필요가 없던 문의(처리 중)는 알리지 않는다', async () => {
    useServer({ status: 'in_progress' });
    const { client } = renderPage();
    await waitForPage();
    await waitForIdle(client);

    expect(statusText()).toBe('');
  });

  it('열기가 실패하면 알리지 않는다 (막는 오류도 없다)', async () => {
    useServer(WAITING);
    vi.mocked(openAdminInquiry).mockRejectedValue(new Error('network'));
    const { client } = renderPage();
    await waitForPage();
    await waitFor(() => expect(openAdminInquiry).toHaveBeenCalledTimes(1));
    await waitForIdle(client);

    expect(statusText()).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('미리보기에서는 알리지 않는다', async () => {
    useServer(WAITING);
    const { client } = renderPage({ peek: true });
    await waitForPage();
    await waitForIdle(client);

    expect(statusText()).toBe('');
  });

  it('성공하면 실패 안내는 없다', async () => {
    useServer(WAITING);
    const { client } = renderPage();
    await waitForPage();
    await waitForStatus(CLAIM_ANNOUNCEMENT);
    await waitForIdle(client);

    expect(screen.queryByText(OPEN_FAILURE_NOTE)).not.toBeInTheDocument();
  });

  it('열기가 실패하면 평문 안내(알림 영역·alert 아님)를 보이고 알림 영역은 비어 있다', async () => {
    useServer(WAITING);
    vi.mocked(openAdminInquiry).mockRejectedValue(new Error('network'));
    const { client } = renderPage();
    await waitForPage();

    const note = await screen.findByText(OPEN_FAILURE_NOTE);
    await waitForIdle(client);

    expect(note).toBeVisible();
    expect(note.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(note.closest('[aria-live]')).toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(statusText()).toBe('');
    expect(openAdminInquiry).toHaveBeenCalledTimes(1);
  });

  it('열기가 실패해도 화면은 계속 쓸 수 있다 (담당자를 직접 고를 수 있다)', async () => {
    useServer(WAITING);
    vi.mocked(openAdminInquiry).mockRejectedValue(new Error('network'));
    const { client } = renderPage();
    await waitForPage();
    await screen.findByText(OPEN_FAILURE_NOTE);
    await waitForIdle(client);

    expect(assigneeSelect()).toBeInTheDocument();
    expect(visibleLabels('답변 대기').length).toBeGreaterThan(0);
  });

  it('경합: 다시 불러온 결과의 담당자가 다른 운영자면 알리지도 안내하지도 않는다 (RPC 는 아무것도 안 하고 성공한다)', async () => {
    useServer(WAITING);
    vi.mocked(openAdminInquiry).mockImplementation((async () => {
      // 다른 운영자가 먼저 담당했다. 이 호출은 no-op 으로 성공한다.
      changeServerInquiry(server, {
        status: 'in_progress',
        assigneeId: 'op-1',
        assigneeEmail: 'opa@moa.test',
      });
    }) as never);
    const { client } = renderPage();
    await waitForPage();

    await waitFor(() =>
      expect(within(header()).getByText('담당 opa')).toBeInTheDocument(),
    );
    await waitForIdle(client);
    await flush();

    expect(openAdminInquiry).toHaveBeenCalledTimes(1);
    expect(statusText()).toBe('');
    expect(screen.queryByText(OPEN_FAILURE_NOTE)).not.toBeInTheDocument();
    expect(within(header()).queryByText('담당 나')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('다시 불러온 결과가 "처리 중" 이 아니면 (내가 담당자여도) 알리지 않는다', async () => {
    useServer(WAITING);
    vi.mocked(openAdminInquiry).mockImplementation((async () => {
      changeServerInquiry(server, {
        status: 'answered',
        assigneeId: 'op-me',
        assigneeEmail: 'me@moa.test',
      });
    }) as never);
    const { client } = renderPage();
    await waitForPage();

    await waitFor(() =>
      expect(visibleLabels('답변 완료').length).toBeGreaterThan(0),
    );
    await waitForIdle(client);
    await flush();

    expect(statusText()).toBe('');
    expect(screen.queryByText(OPEN_FAILURE_NOTE)).not.toBeInTheDocument();
  });

  it('현재 사용자가 다르면 (담당자가 나 가 아니므로) 알리지 않는다', async () => {
    useServer(WAITING);
    installCurrentUser('someone-else');
    const { client } = renderPage();
    await waitForPage();

    await waitFor(() => expect(openAdminInquiry).toHaveBeenCalledTimes(1));
    await waitForIdle(client);
    await flush();

    expect(statusText()).toBe('');
    expect(within(header()).queryByText('담당 나')).not.toBeInTheDocument();
  });

  it('열린 뒤 헤더가 "담당 나" 로 바뀐다 (내가 담당자다)', async () => {
    useServer(WAITING);
    const { client } = renderPage();
    await waitForPage();

    await waitFor(() =>
      expect(within(header()).getByText('담당 나')).toBeInTheDocument(),
    );
    expect(within(header()).queryByText(/담당 me/)).not.toBeInTheDocument();
    await waitForIdle(client);
    expect(assigneeSelect()).toHaveDisplayValue('me@moa.test');
  });
});

describe('헤더 - 담당자와 카테고리 칩', () => {
  it('담당자는 "담당 {이메일 앞부분}" 으로 보이고 전체 이메일은 헤더에 노출하지 않는다', async () => {
    useServer({ status: 'in_progress' });
    renderPage();
    await waitForPage();

    expect(within(header()).getByText(/담당 opb(?!@)/)).toBeVisible();
    expect(header()).not.toHaveTextContent('opb@moa.test');
  });

  it('담당자가 나 이면 "담당 나" 다 (이메일 앞부분이 아니다)', async () => {
    useServer({
      status: 'in_progress',
      assigneeId: 'op-me',
      assigneeEmail: 'me@moa.test',
    });
    renderPage();
    await waitForPage();

    await waitFor(() =>
      expect(within(header()).getByText('담당 나')).toBeVisible(),
    );
    expect(within(header()).queryByText(/담당 me/)).not.toBeInTheDocument();
    expect(header()).not.toHaveTextContent('me@moa.test');
  });

  it('다른 운영자의 이메일 앞부분이 me 여도 id 가 다르면 "담당 me" 로 보인다', async () => {
    useServer({
      status: 'in_progress',
      assigneeId: 'op-9',
      assigneeEmail: 'me@other.test',
    });
    renderPage();
    await waitForPage();

    await waitFor(() =>
      expect(within(header()).getByText(/담당 me(?!@)/)).toBeVisible(),
    );
    expect(within(header()).queryByText('담당 나')).not.toBeInTheDocument();
  });

  it('다른 운영자가 담당이면 "담당 나" 로 보이지 않는다', async () => {
    useServer({ status: 'in_progress' });
    const { client } = renderPage();
    await waitForPage();
    await waitForIdle(client);
    await flush();

    expect(within(header()).getByText(/담당 opb(?!@)/)).toBeVisible();
    expect(within(header()).queryByText('담당 나')).not.toBeInTheDocument();
  });

  it('담당자가 없으면 "담당 미지정" 이다', async () => {
    useServer({
      status: 'in_progress',
      assigneeId: null,
      assigneeEmail: null,
    });
    renderPage();
    await waitForPage();

    expect(within(header()).getByText(/담당 미지정/)).toBeVisible();
  });

  it('카테고리가 있으면 라벨 칩을 보이고 미분류 강조는 없다', async () => {
    useServer({ status: 'in_progress', category: 'account_login' });
    renderPage();
    await waitForPage();

    const chip = within(header()).getByText('계정·로그인');

    expect(chip).toBeVisible();
    expect(chip.closest('[data-uncategorized="true"]')).toBeNull();
    expect(
      header().querySelector('[data-uncategorized="true"]'),
    ).not.toBeInTheDocument();
  });

  it('카테고리가 null 이면 "미분류" 칩을 data-uncategorized="true" 로 강조한다', async () => {
    useServer({
      status: 'in_progress',
      category: null,
      categoryConfidence: null,
    });
    renderPage();
    await waitForPage();

    const chip = within(header()).getByText('미분류');

    expect(chip).toBeVisible();
    expect(chip.closest('[data-uncategorized="true"]')).not.toBeNull();
  });
});

describe('헤더 - 24시간 초과 표시', () => {
  // NOW = 2026-10-01T05:12:00Z
  const OVERDUE = '24시간 초과';

  it.each([
    ['25시간 대기', '2026-09-30T04:12:00Z', true],
    ['51시간 대기', '2026-09-29T02:12:00Z', true],
    [
      '24시간 59분 대기(정수 24시간, 기준은 24시간 "초과")',
      '2026-09-30T04:13:00Z',
      false,
    ],
    ['정확히 24시간', '2026-09-30T05:12:00Z', false],
    ['5시간', '2026-10-01T00:12:00Z', false],
  ])(
    '처리 중 문의가 %s 이면 표시 여부는 %s 다',
    async (_name, waitingSince, isOverdue) => {
      useServer({ status: 'in_progress', waitingSince });
      renderPage();
      await waitForPage();

      if (isOverdue) {
        const marker = within(header()).getByText(OVERDUE);

        expect(marker).toBeVisible();
        expect(marker.closest('[data-overdue="true"]')).not.toBeNull();
      } else {
        expect(within(header()).queryByText(OVERDUE)).not.toBeInTheDocument();
        expect(
          header().querySelector('[data-overdue="true"]'),
        ).not.toBeInTheDocument();
      }
    },
  );

  it('대기 시간 표기("대기 2일 3시간") 옆에 보인다', async () => {
    useServer({ status: 'in_progress', waitingSince: '2026-09-29T02:12:00Z' });
    renderPage();
    await waitForPage();

    const meta = within(header()).getByText(/대기 2일 3시간/);
    const marker = within(header()).getByText(OVERDUE);

    expect(meta.parentElement).toBe(marker.parentElement);
  });

  it('답변 대기 문의(미리보기로 열어 상태가 유지된다)도 24시간을 넘으면 보인다', async () => {
    useServer({ ...WAITING, waitingSince: '2026-09-29T02:12:00Z' });
    renderPage({ peek: true });
    await waitForPage();

    expect(within(header()).getByText(OVERDUE)).toBeVisible();
  });

  it.each(['answered', 'closed'] as const)(
    '%s 문의는 오래되어도 보이지 않는다 (열려 있는 문의만)',
    async (status) => {
      useServer({
        status,
        closeReason: status === 'closed' ? '테스트' : null,
        waitingSince: '2026-09-29T02:12:00Z',
      });
      renderPage();
      await waitForPage();

      expect(within(header()).queryByText(OVERDUE)).not.toBeInTheDocument();
    },
  );

  it('표시는 알림 영역이 아닌 평문이다', async () => {
    useServer({ status: 'in_progress', waitingSince: '2026-09-29T02:12:00Z' });
    renderPage();
    await waitForPage();

    expect(
      within(header())
        .getByText(OVERDUE)
        .closest('[role="status"], [role="alert"]'),
    ).toBeNull();
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});
