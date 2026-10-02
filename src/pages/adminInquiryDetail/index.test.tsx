import type { ReactNode } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAdminInquiry,
  getAdminInquiryMessages,
  getAdminList,
  getAdminUserRecentInquiries,
  openAdminInquiry,
  replyAdminInquiry,
} from '@/entities/admin';
import {
  deleteInquiryAttachments,
  getAttachmentUrls,
} from '@/entities/inquiry';
import { adminQueryKeys } from '@/features/adminInquiry';
import { useToast } from '@/shared/ui';

import {
  FOLLOW_UP,
  INQUIRY_ID,
  MEMO,
  NOW,
  PERMISSION_TEXT,
  QUESTION,
  REPLY,
  SUPABASE,
  TITLE,
  createServer,
  deferred,
  installServer,
  makeInquiry,
  photoName,
  renderPage,
  replyBox,
  statusRegion,
  statusText,
  typeReply,
  visibleLabels,
  waitForIdle,
  waitForPage,
  isAriaDisabled,
  replyButton,
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

vi.mock('@/entities/inquiry', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  deleteInquiryAttachments: vi.fn(),
  getAttachmentUrls: vi.fn(),
  uploadInquiryAttachment: vi.fn(),
}));

const LOAD_ERROR_TEXT = '문의를 불러오지 못했어요. 다시 시도해주세요.';
const NOT_FOUND_TEXT = '문의를 찾을 수 없어요.';
const SLOW = { timeout: 5000 };

let server: Server;

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  safeBack.useSafeBack.mockImplementation(() => safeBack.goBack);
  act(() => useToast.setState({ message: null, tone: 'default' }));
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  vi.mocked(deleteInquiryAttachments).mockResolvedValue(undefined);
  server = createServer();
  installServer(server);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AdminInquiryDetailPage - 불러오기', () => {
  it('불러오는 동안 aria-busy 영역과 <h1> 을 보이고 role="status" 는 하나뿐이며 비어 있다', () => {
    vi.mocked(getAdminInquiry).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(statusText()).toBe('');
  });

  it('브라우저 supabase 와 inquiryId 로 문의, 메시지, 운영자, 이전 문의를 조회한다', async () => {
    renderPage();
    await waitForPage();

    expect(getAdminInquiry).toHaveBeenCalledWith(SUPABASE, INQUIRY_ID);
    await waitFor(() => {
      expect(getAdminInquiryMessages).toHaveBeenCalledWith(
        SUPABASE,
        INQUIRY_ID,
      );
      expect(getAdminList).toHaveBeenCalledWith(SUPABASE);
      expect(getAdminUserRecentInquiries).toHaveBeenCalledWith(
        SUPABASE,
        expect.objectContaining({ inquiryId: INQUIRY_ID }),
      );
    });
  });

  it('not_found 는 "문의를 찾을 수 없어요." 와 /admin/inquiries 링크를 보이고 이동(리다이렉트)하지 않는다', async () => {
    vi.mocked(getAdminInquiry).mockRejectedValue({
      code: 'P0001',
      message: 'not_found',
    });
    renderPage();

    expect(await screen.findByText(NOT_FOUND_TEXT, {}, SLOW)).toBeVisible();
    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/admin/inquiries');
    expect(screen.queryByText(LOAD_ERROR_TEXT)).not.toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  }, 10_000);

  it('그 밖의 오류는 alert 와 "다시 시도" 를 보이고, 누르면 다시 불러온다', async () => {
    vi.mocked(getAdminInquiry).mockRejectedValue(new Error('boom'));
    renderPage();

    const alert = await screen.findByRole('alert', {}, SLOW);
    expect(alert).toHaveTextContent(LOAD_ERROR_TEXT);
    expect(screen.queryByText(NOT_FOUND_TEXT)).not.toBeInTheDocument();

    installServer(server);
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await waitForPage()).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  }, 10_000);

  it.each(['forbidden', 'unauthorized'])(
    '%s 는 권한/로그인 만료 안내를 보인다 (원문 메시지는 노출하지 않는다)',
    async (message) => {
      vi.mocked(getAdminInquiry).mockRejectedValue({
        code: 'P0001',
        message,
      });
      renderPage();

      const alert = await screen.findByRole('alert', {}, SLOW);

      expect(alert).toHaveTextContent(PERMISSION_TEXT);
      expect(alert).not.toHaveTextContent(message);
      expect(screen.queryByText(LOAD_ERROR_TEXT)).not.toBeInTheDocument();
    },
    10_000,
  );

  it('role="status" 는 불러온 뒤에도 하나뿐이고 비어 있다', async () => {
    renderPage();
    await waitForPage();

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(statusText()).toBe('');
  });
});

describe('AdminInquiryDetailPage - 열기(admin_open_inquiry)', () => {
  beforeEach(() => {
    server = createServer({ inquiry: { status: 'waiting', assigneeId: null } });
    installServer(server);
  });

  it('첫 조회가 끝나기 전에는 호출하지 않는다', async () => {
    const gate = deferred<ReturnType<typeof makeInquiry>>();
    vi.mocked(getAdminInquiry).mockReturnValue(gate.promise as never);
    renderPage();
    await act(async () => {});

    expect(openAdminInquiry).not.toHaveBeenCalled();

    gate.resolve(makeInquiry({ status: 'waiting' }));

    await waitFor(() => expect(openAdminInquiry).toHaveBeenCalledTimes(1));
  });

  it('답변 대기 문의는 불러온 뒤 한 번 열고, 다시 불러와 "처리 중" 으로 보인다', async () => {
    renderPage();
    await waitForPage();

    await waitFor(() =>
      expect(openAdminInquiry).toHaveBeenCalledWith(SUPABASE, INQUIRY_ID),
    );

    await waitFor(() =>
      expect(visibleLabels('처리 중').length).toBeGreaterThan(0),
    );
    expect(visibleLabels('답변 대기')).toHaveLength(0);
    expect(openAdminInquiry).toHaveBeenCalledTimes(1);
    // 열기 뒤 문의와 메시지를 모두 새로 받는다.
    expect(vi.mocked(getAdminInquiry).mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
    expect(
      vi.mocked(getAdminInquiryMessages).mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('Strict Mode 의 이펙트 이중 실행에도 한 번만 호출한다', async () => {
    const { client } = renderPage({ strict: true });
    await waitForPage();
    await waitFor(() => expect(openAdminInquiry).toHaveBeenCalled());
    await waitForIdle(client);

    expect(openAdminInquiry).toHaveBeenCalledTimes(1);
  });

  it('다시 불러와도(서버가 여전히 waiting 이어도) 다시 열지 않는다', async () => {
    vi.mocked(openAdminInquiry).mockResolvedValue(undefined);
    const { client } = renderPage();
    await waitForPage();
    await waitFor(() => expect(openAdminInquiry).toHaveBeenCalledTimes(1));
    await waitForIdle(client);

    await act(async () => {
      await client.invalidateQueries({
        queryKey: adminQueryKeys.inquiry(INQUIRY_ID),
      });
    });
    await waitForIdle(client);

    expect(openAdminInquiry).toHaveBeenCalledTimes(1);
  });

  it.each(['in_progress', 'answered', 'closed'] as const)(
    '%s 문의는 열지 않는다',
    async (status) => {
      server = createServer({
        inquiry: { status, closeReason: status === 'closed' ? '테스트' : null },
      });
      installServer(server);
      const { client } = renderPage();
      await waitForPage();
      await waitForIdle(client);

      expect(openAdminInquiry).not.toHaveBeenCalled();
    },
  );

  it('열기 뒤 답변은 열기로 갱신된 updatedAt 을 기대값으로 보낸다', async () => {
    const { client } = renderPage();
    await waitForPage();
    await waitFor(() =>
      expect(visibleLabels('처리 중').length).toBeGreaterThan(0),
    );
    await waitForIdle(client);

    typeReply('확인 후 답변드려요');
    fireEvent.click(replyButton());
    fireEvent.click(
      within(
        screen.getByRole('alertdialog', { name: '답변을 등록할까요?' }),
      ).getByRole('button', { name: '등록' }),
    );

    await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(1));
    expect(replyAdminInquiry).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({
        expectedUpdatedAt: '2026-10-01T04:10:00.000Z',
      }),
    );
  });

  it('열기가 실패해도 막는 오류 없이 화면을 계속 쓸 수 있다', async () => {
    vi.mocked(openAdminInquiry).mockRejectedValue(new Error('network'));
    const { client } = renderPage();
    await waitForPage();
    await waitFor(() => expect(openAdminInquiry).toHaveBeenCalledTimes(1));
    await waitForIdle(client);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(replyBox()).toBeInTheDocument();
    typeReply('입력 가능');
    expect(replyBox()).toHaveValue('입력 가능');
    expect(visibleLabels('답변 대기').length).toBeGreaterThan(0);
    expect(openAdminInquiry).toHaveBeenCalledTimes(1);
  });
});

describe('AdminInquiryDetailPage - 헤더', () => {
  it('<h1> 은 문의 제목이다', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: TITLE }),
    ).toBeInTheDocument();
  });

  it('"문의 관리" 링크는 필터를 싣지 않은 /admin/inquiries 로 간다', async () => {
    renderPage();
    await waitForPage();

    const link = screen.getByRole('link', { name: '문의 관리' });

    expect(link).toHaveAttribute('href', '/admin/inquiries');
  });

  it('"목록으로" 버튼은 useSafeBack("/admin/inquiries") 의 goBack 이다', async () => {
    renderPage();
    await waitForPage();

    expect(safeBack.useSafeBack).toHaveBeenCalledWith('/admin/inquiries');

    fireEvent.click(screen.getByRole('button', { name: '목록으로' }));

    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('메타 줄에 관리자용 상태 라벨, "접수 MM.DD HH:mm"(createdAt), "대기 …"(waitingSince) 를 보인다', async () => {
    server = createServer({
      inquiry: {
        status: 'in_progress',
        createdAt: '2026-09-30T00:00:00Z',
        waitingSince: '2026-10-01T00:12:00Z',
      },
    });
    installServer(server);
    renderPage();
    await waitForPage();

    expect(visibleLabels('처리 중').length).toBeGreaterThan(0);
    expect(screen.getByText(/접수 09\.30 09:00/)).toBeInTheDocument();
    expect(screen.getByText(/대기 5시간/)).toBeInTheDocument();
  });

  it('대기 시간은 일 단위도 표기한다 (51시간 -> 2일 3시간)', async () => {
    server = createServer({
      inquiry: { status: 'waiting', waitingSince: '2026-09-29T02:12:00Z' },
    });
    installServer(server);
    renderPage();
    await waitForPage();

    expect(screen.getByText(/대기 2일 3시간/)).toBeInTheDocument();
  });

  it.each(['answered', 'closed'] as const)(
    '%s 에서는 대기 시간을 보이지 않는다',
    async (status) => {
      server = createServer({
        inquiry: { status, closeReason: status === 'closed' ? '테스트' : null },
      });
      installServer(server);
      renderPage();
      await waitForPage();

      expect(
        screen.queryByText(/대기 (1시간 미만|\d+시간|\d+일)/),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/접수 10\.01 09:12/)).toBeInTheDocument();
    },
  );

  it('답변 완료 / 종결 상태 라벨을 보인다', async () => {
    server = createServer({ inquiry: { status: 'answered' } });
    installServer(server);
    renderPage();
    await waitForPage();

    expect(visibleLabels('답변 완료').length).toBeGreaterThan(0);
  });
});

describe('AdminInquiryDetailPage - 스레드', () => {
  const load = async (
    messages = [QUESTION, REPLY, FOLLOW_UP],
    afterInstall?: () => void,
  ) => {
    server = createServer({ messages });
    installServer(server);
    afterInstall?.();
    const view = renderPage();
    await waitForPage();

    return view;
  };

  const before = (a: HTMLElement, b: HTMLElement) =>
    Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  it('사용자 질문 -> 운영자 답변 -> 추가 문의 -> 내부 메모 순서(서버가 준 시간순)로 렌더링한다', async () => {
    await load([QUESTION, MEMO, REPLY, FOLLOW_UP]);

    const question = await screen.findByText(QUESTION.body);
    const memo = screen.getByText(MEMO.body);
    const reply = screen.getByText(REPLY.body);
    const followUp = screen.getByText(FOLLOW_UP.body);

    expect(before(question, memo)).toBe(true);
    expect(before(memo, reply)).toBe(true);
    expect(before(reply, followUp)).toBe(true);
  });

  it('사용자 질문 카드는 <h2> "사용자 · MM.DD HH:mm" 으로 이름 붙는다', async () => {
    await load();

    const article = await screen.findByRole('article', {
      name: /사용자 · 10\.01 09:12/,
    });

    expect(
      within(article).getByRole('heading', { level: 2 }),
    ).toHaveTextContent(/사용자 · 10\.01 09:12/);
    expect(within(article).getByText(QUESTION.body)).toBeInTheDocument();
  });

  it('추가 문의 카드는 <h2> "추가 문의 · MM.DD HH:mm" 으로 이름 붙는다', async () => {
    await load();

    const article = await screen.findByRole('article', {
      name: /추가 문의 · 10\.01 15:00/,
    });

    expect(within(article).getByText(FOLLOW_UP.body)).toBeInTheDocument();
  });

  it('운영자 답변 카드는 <h2> "운영자 답변 · MM.DD HH:mm" 이고 작성자는 이메일 앞부분만 보인다', async () => {
    await load();

    const article = await screen.findByRole('article', {
      name: /운영자 답변 · 10\.01 14:20/,
    });

    expect(
      within(article).getByRole('heading', { level: 2 }),
    ).toBeInTheDocument();
    expect(within(article).getByText(REPLY.body)).toBeInTheDocument();
    expect(article).toHaveTextContent('opb');
    expect(article).not.toHaveTextContent('opb@moa.test');
  });

  it('내부 메모는 data-kind="memo" 의 구분된 카드이고 "내부 메모 · 사용자에게 보이지 않음", 작성자(앞부분), 시각을 보인다', async () => {
    await load([QUESTION, MEMO, REPLY]);

    const memo = await screen.findByRole('article', {
      name: /내부 메모 · 사용자에게 보이지 않음/,
    });

    expect(memo).toHaveAttribute('data-kind', 'memo');
    expect(within(memo).getByText(MEMO.body)).toBeInTheDocument();
    expect(memo).toHaveTextContent('opb');
    expect(memo).not.toHaveTextContent('opb@moa.test');
    expect(memo).toHaveTextContent('10.01 10:00');
    expect(within(memo).getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('질문과 답변 카드는 memo 로 표시되지 않는다', async () => {
    await load([QUESTION, MEMO, REPLY]);
    await screen.findByText(REPLY.body);

    const reply = screen.getByRole('article', { name: /운영자 답변/ });
    const question = screen.getByRole('article', { name: /사용자 · 10\.01/ });

    expect(reply).not.toHaveAttribute('data-kind', 'memo');
    expect(question).not.toHaveAttribute('data-kind', 'memo');
    expect(document.querySelectorAll('[data-kind="memo"]')).toHaveLength(1);
  });

  describe('첨부 사진', () => {
    it('사용자 문의/추가 문의 썸네일은 "사용자 문의 첨부 사진 N 크게 보기", 답변은 "운영자 답변 첨부 사진 N 크게 보기" 다', async () => {
      await load([
        { ...QUESTION, attachments: ['user-1/f/a.jpg', 'user-1/f/b.jpg'] },
        { ...REPLY, attachments: ['user-1/r/r.jpg'] },
        { ...FOLLOW_UP, attachments: ['user-1/g/c.jpg'] },
      ]);

      const first = await screen.findByRole('button', { name: photoName(1) });
      expect(first).toHaveAttribute('aria-haspopup', 'dialog');
      expect(first.querySelector('img')).toHaveAttribute(
        'src',
        'https://signed.test/user-1/f/a.jpg',
      );
      expect(first.querySelector('img')).toHaveAttribute('alt', '');
      expect(
        screen.getAllByRole('button', { name: photoName(1) }),
      ).toHaveLength(2);
      expect(
        screen.getByRole('button', { name: photoName(2) }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: photoName(1, '운영자 답변') }),
      ).toBeInTheDocument();
      expect(getAttachmentUrls).toHaveBeenCalledWith(SUPABASE, [
        'user-1/f/a.jpg',
        'user-1/f/b.jpg',
      ]);
    });

    it('서명에 실패한 사진은 버튼이 아닌 "사진을 불러오지 못했어요" 자리표시다', async () => {
      await load(
        [{ ...QUESTION, attachments: ['user-1/f/a.jpg', 'user-1/f/bad.jpg'] }],
        () => {
          vi.mocked(getAttachmentUrls).mockImplementation((async (
            _supabase: unknown,
            paths: string[],
          ) =>
            paths.map((path) => ({
              path,
              url: path.includes('bad') ? null : `https://signed.test/${path}`,
            }))) as never);
        },
      );

      expect(
        await screen.findByText('사진을 불러오지 못했어요'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: photoName(1) }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: photoName(2) }),
      ).not.toBeInTheDocument();
    });

    it('썸네일을 누르면 "첨부 사진 N / 전체" 뷰어 dialog 가 열리고 닫으면 포커스가 썸네일로 돌아간다', async () => {
      await load([
        { ...QUESTION, attachments: ['user-1/f/a.jpg', 'user-1/f/b.jpg'] },
      ]);
      const trigger = await screen.findByRole('button', { name: photoName(2) });
      trigger.focus();

      fireEvent.click(trigger);

      const dialog = await screen.findByRole('dialog', {
        name: '첨부 사진 2 / 2',
      });
      expect(within(dialog).getByRole('img')).toHaveAttribute(
        'src',
        'https://signed.test/user-1/f/b.jpg',
      );

      fireEvent.click(within(dialog).getByRole('button', { name: '닫기' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('뷰어의 이전/다음은 처음·끝에서 aria-disabled 이고 포커스를 유지한다', async () => {
      await load([
        { ...QUESTION, attachments: ['user-1/f/a.jpg', 'user-1/f/b.jpg'] },
      ]);
      fireEvent.click(
        await screen.findByRole('button', { name: photoName(1) }),
      );
      const dialog = await screen.findByRole('dialog', {
        name: '첨부 사진 1 / 2',
      });
      const prev = within(dialog).getByRole('button', { name: '이전 사진' });

      expect(isAriaDisabled(prev)).toBe(true);
      expect(prev).not.toBeDisabled();

      fireEvent.click(
        within(dialog).getByRole('button', { name: '다음 사진' }),
      );
      const second = await screen.findByRole('dialog', {
        name: '첨부 사진 2 / 2',
      });

      expect(
        isAriaDisabled(
          within(second).getByRole('button', { name: '다음 사진' }),
        ),
      ).toBe(true);
    });

    it('Esc 로 닫으면 포커스가 썸네일로 돌아간다', async () => {
      await load([{ ...QUESTION, attachments: ['user-1/f/a.jpg'] }]);
      const trigger = await screen.findByRole('button', { name: photoName(1) });
      trigger.focus();
      fireEvent.click(trigger);
      await screen.findByRole('dialog');

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  describe('메시지 조회 실패', () => {
    it('헤더와 사이드 패널은 남기고 스레드 영역에 인라인 "다시 시도" 를 보이며, 누르면 스레드가 나타난다', async () => {
      vi.mocked(getAdminInquiryMessages).mockRejectedValue(new Error('x'));
      renderPage();
      await waitForPage();

      const retry = await screen.findByRole('button', { name: '다시 시도' });

      expect(screen.getByLabelText('상태')).toBeInTheDocument();
      expect(screen.getByText(/접수 10\.01 09:12/)).toBeInTheDocument();
      expect(screen.queryByText(LOAD_ERROR_TEXT)).not.toBeInTheDocument();

      installServer(server);
      fireEvent.click(retry);

      expect(await screen.findByText(QUESTION.body)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: '다시 시도' }),
      ).not.toBeInTheDocument();
    });

    it('메시지를 모르는 동안에는 기대 메시지 id 를 알 수 없어 답변 등록을 막는다 (aria-disabled)', async () => {
      vi.mocked(getAdminInquiryMessages).mockRejectedValue(new Error('x'));
      renderPage();
      await waitForPage();
      await screen.findByRole('button', { name: '다시 시도' });

      typeReply('답변');

      expect(isAriaDisabled(replyButton())).toBe(true);
      fireEvent.click(replyButton());
      expect(
        screen.queryByRole('alertdialog', { name: '답변을 등록할까요?' }),
      ).not.toBeInTheDocument();
    });
  });

  it('role="status" 는 스레드가 그려진 뒤에도 하나뿐이다', async () => {
    await load();
    await screen.findByText(REPLY.body);

    expect(statusRegion()).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});
