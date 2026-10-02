import type { ReactNode } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAdminInquiry,
  getAdminInquiryMessages,
  addAdminMemo,
  replyAdminInquiry,
  updateAdminInquiryMeta,
} from '@/entities/admin';
import {
  deleteInquiryAttachments,
  uploadInquiryAttachment,
} from '@/entities/inquiry';
import { adminQueryKeys } from '@/features/adminInquiry';
import { useToast } from '@/shared/ui';

import {
  INQUIRY_ID,
  NOW,
  QUESTION,
  REFETCH_HINT,
  REPLY,
  SUPABASE,
  attach,
  categorySaveButton,
  categorySelect,
  choose,
  confirmReply,
  createServer,
  deferred,
  deletePhotoButton,
  describedText,
  flush,
  installScrollSpy,
  installServer,
  isAriaDisabled,
  makeFile,
  makeMessage,
  memoButton,
  openPreview,
  queryPreviewDialog,
  renderPage,
  replyBox,
  replyButton,
  scrolledElements,
  statusSaveButton,
  statusSelect,
  submitReply,
  tab,
  typeMemo,
  typeReply,
  waitForIdle,
  waitForPage,
  wasScrolledTo,
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

const BODY = '설정에서 동기화를 한 번 더 눌러주세요.';
const CONFLICT_TEXT = '다른 운영자가 먼저 답변했어요. 내용을 확인해주세요.';
const MEMO_LATER = makeMessage(
  'm9',
  'memo',
  '나중에 남긴 메모',
  '2026-10-01T06:30:00Z',
);
const OTHER_REPLY = makeMessage(
  'm10',
  'reply',
  '다른 운영자의 답변이에요.',
  '2026-10-01T05:30:00Z',
  { authorEmail: 'opa@moa.test', authorId: 'op-1' },
);

let server: Server;

const loadPage = async () => {
  const view = renderPage();

  await waitForPage();
  await waitForIdle(view.client);

  return view;
};

const alerts = () => screen.queryAllByRole('alert');

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  safeBack.useSafeBack.mockImplementation(() => safeBack.goBack);
  act(() => useToast.setState({ message: null, tone: 'default' }));
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  installScrollSpy();
  server = createServer({ messages: [QUESTION, REPLY, MEMO_LATER] });
  installServer(server);
  vi.mocked(uploadInquiryAttachment).mockImplementation(
    (async (
      _supabase: unknown,
      {
        userId,
        folderId,
        file,
      }: { userId: string; folderId: string; file: File },
    ) => `${userId}/${folderId}/${file.name}`) as never,
  );
  vi.mocked(deleteInquiryAttachments).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('답변 등록 - 미리보기를 연 시점의 기대값 스냅샷', () => {
  type Change = { message: boolean; updatedAt: boolean };

  /** 미리보기가 열려 있는 동안 서버가 바뀌고, 화면이 그 최신 값을 받아 둔다. */
  const changeWhileOpen = async (
    client: ReturnType<typeof renderPage>['client'],
    { message, updatedAt }: Change,
  ) => {
    if (message) server.messages.push(OTHER_REPLY);
    if (updatedAt) server.inquiry.updatedAt = '2026-10-01T05:30:00Z';

    await act(async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: adminQueryKeys.inquiry(INQUIRY_ID),
        }),
        client.invalidateQueries({
          queryKey: adminQueryKeys.messages(INQUIRY_ID),
        }),
      ]);
    });
    await waitForIdle(client);
  };

  it('업로드하는 사이 새 답변이 도착해도 RPC 에는 미리보기를 연 시점의 기대값을 보낸다', async () => {
    const { container, client } = await loadPage();
    attach(container, [makeFile('a.png')]);
    const upload = deferred<string>();
    vi.mocked(uploadInquiryAttachment).mockReturnValue(upload.promise);
    openPreview(BODY);

    confirmReply();
    await waitFor(() => expect(uploadInquiryAttachment).toHaveBeenCalled());
    await changeWhileOpen(client, { message: true, updatedAt: true });
    upload.resolve(`user-1/folder/a.png`);

    await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(1));
    expect(replyAdminInquiry).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({
        expectedLastMessageId: REPLY.id,
        expectedUpdatedAt: '2026-10-01T04:00:00Z',
      }),
    );
  });

  it('미리보기를 여는 동안 아무것도 바뀌지 않았으면(조회만 다시 했으면) 그대로 등록된다', async () => {
    const { client } = await loadPage();
    openPreview(BODY);
    await changeWhileOpen(client, { message: false, updatedAt: false });

    confirmReply();

    await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(1));
    expect(replyAdminInquiry).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({
        expectedLastMessageId: REPLY.id,
        expectedUpdatedAt: '2026-10-01T04:00:00Z',
      }),
    );
    expect(alerts()).toHaveLength(0);
  });

  it.each<[string, Change]>([
    ['다른 운영자의 답변(마지막 메시지)', { message: true, updatedAt: false }],
    ['updatedAt 만 달라짐', { message: false, updatedAt: true }],
    ['둘 다', { message: true, updatedAt: true }],
  ])(
    '미리보기를 연 뒤 %s 이 도착하면 확인해도 RPC·업로드 없이 충돌 안내(새로고침)를 보인다',
    async (_name, change) => {
      const { container, client } = await loadPage();
      attach(container, [makeFile('a.png')]);
      openPreview(BODY);
      await changeWhileOpen(client, change);

      confirmReply();

      expect(await screen.findByRole('alert')).toHaveTextContent(CONFLICT_TEXT);
      expect(
        screen.getByRole('button', { name: '새로고침' }),
      ).toBeInTheDocument();
      await waitForIdle(client);
      expect(alerts()).toHaveLength(1);
      expect(replyAdminInquiry).not.toHaveBeenCalled();
      expect(uploadInquiryAttachment).not.toHaveBeenCalled();
      expect(deleteInquiryAttachments).not.toHaveBeenCalled();
      expect(queryPreviewDialog()).not.toBeInTheDocument();
      expect(replyBox()).toHaveValue(BODY);
      expect(deletePhotoButton('a.png')).toBeInTheDocument();
      expect(document.activeElement).not.toBe(document.body);
    },
  );

  it('화면에서 감지한 충돌 뒤 "새로고침" 하고 다시 등록하면 최신 기대값을 쓴다', async () => {
    const { client } = await loadPage();
    openPreview(BODY);
    await changeWhileOpen(client, { message: true, updatedAt: true });
    confirmReply();
    await screen.findByRole('alert');
    await waitForIdle(client);

    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));
    await waitForIdle(client);
    await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(false));
    submitReply(BODY);

    await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(1));
    expect(replyAdminInquiry).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({
        expectedLastMessageId: OTHER_REPLY.id,
        expectedUpdatedAt: '2026-10-01T05:30:00Z',
      }),
    );
  });
});

describe('답변 등록 - 다시 불러오는 동안 막기', () => {
  const CASES = [
    [
      '문의',
      () => vi.mocked(getAdminInquiry),
      adminQueryKeys.inquiry,
      () => ({ ...server.inquiry }),
    ],
    [
      '메시지',
      () => vi.mocked(getAdminInquiryMessages),
      adminQueryKeys.messages,
      () => server.messages.map((message) => ({ ...message })),
    ],
  ] as const;

  it.each(CASES)(
    '%s 를 다시 불러오는 동안 "답변 등록" 은 aria-disabled 이고 "최신 내용을 불러오는 중이에요" 가 연결되며, 끝나면 풀린다',
    async (_name, getFetcher, key, getData) => {
      const { client } = await loadPage();
      typeReply(BODY);
      expect(isAriaDisabled(replyButton())).toBe(false);
      const gate = deferred<unknown>();
      getFetcher().mockImplementationOnce((() => gate.promise) as never);

      act(() => {
        void client.invalidateQueries({ queryKey: key(INQUIRY_ID) });
      });

      await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(true));
      expect(describedText(replyButton())).toContain(REFETCH_HINT);
      expect(replyButton()).not.toBeDisabled();
      fireEvent.click(replyButton());
      expect(queryPreviewDialog()).not.toBeInTheDocument();
      expect(replyAdminInquiry).not.toHaveBeenCalled();

      gate.resolve(getData());

      await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(false));
      expect(describedText(replyButton())).not.toContain(REFETCH_HINT);
    },
  );

  it('안내는 알림 영역이 아닌 평문이다', async () => {
    const { client } = await loadPage();
    typeReply(BODY);
    const gate = deferred<unknown>();
    vi.mocked(getAdminInquiry).mockImplementationOnce(
      (() => gate.promise) as never,
    );

    act(() => {
      void client.invalidateQueries({
        queryKey: adminQueryKeys.inquiry(INQUIRY_ID),
      });
    });

    await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(true));
    const hint = screen.getByText(REFETCH_HINT);
    expect(hint.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    gate.resolve({ ...server.inquiry });
    await waitForIdle(client);
  });

  it('내부 메모 저장은 다시 불러오는 동안에도 막지 않는다', async () => {
    const { client } = await loadPage();
    const gate = deferred<unknown>();
    vi.mocked(getAdminInquiry).mockImplementationOnce(
      (() => gate.promise) as never,
    );
    act(() => {
      void client.invalidateQueries({
        queryKey: adminQueryKeys.inquiry(INQUIRY_ID),
      });
    });
    fireEvent.click(tab('내부 메모'));
    typeMemo('서버 로그 확인');

    expect(isAriaDisabled(memoButton())).toBe(false);
    fireEvent.click(memoButton());

    await waitFor(() => expect(addAdminMemo).toHaveBeenCalledTimes(1));
    gate.resolve({ ...server.inquiry });
    await waitForIdle(client);
  });

  it('상태·담당자 저장 직후 바로 답변을 시도하면 conflict 가 아니라 이 안내가 보이고, 조회가 끝나면 갱신된 기대값으로 등록된다', async () => {
    const { client } = await loadPage();
    typeReply(BODY);
    choose(statusSelect(), '답변 대기');
    const gate = deferred<unknown>();
    vi.mocked(getAdminInquiry).mockImplementationOnce(
      (() => gate.promise) as never,
    );

    fireEvent.click(statusSaveButton());

    await waitFor(() => expect(updateAdminInquiryMeta).toHaveBeenCalled());
    await waitFor(() =>
      expect(describedText(replyButton())).toContain(REFETCH_HINT),
    );
    expect(isAriaDisabled(replyButton())).toBe(true);
    fireEvent.click(replyButton());
    expect(queryPreviewDialog()).not.toBeInTheDocument();
    expect(replyAdminInquiry).not.toHaveBeenCalled();
    expect(
      screen.queryByText(CONFLICT_TEXT, { exact: false }),
    ).not.toBeInTheDocument();

    gate.resolve({ ...server.inquiry });
    await waitForIdle(client);
    await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(false));
    submitReply(BODY);

    await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(1));
    expect(replyAdminInquiry).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({
        expectedUpdatedAt: '2026-10-01T04:10:00.000Z',
      }),
    );
    expect(alerts()).toHaveLength(0);
  });
});

describe('답변 등록 - 미분류 문의 흐름', () => {
  const BANNER = '카테고리를 먼저 지정해야 답변할 수 있어요';

  const loadUncategorized = async () => {
    server = createServer({
      messages: [QUESTION],
      inquiry: { category: null, categoryConfidence: null },
    });
    installServer(server);

    return loadPage();
  };

  it('입력창 위에 안내 배너와 "지정하러 가기" 버튼을 보인다 (알림 영역은 아니다)', async () => {
    await loadUncategorized();

    const banner = screen.getByText(BANNER);

    expect(banner).toBeVisible();
    expect(
      screen.getByRole('button', { name: '지정하러 가기' }),
    ).toBeInTheDocument();
    expect(banner.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(
      Boolean(
        banner.compareDocumentPosition(replyBox()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('카테고리가 있는 문의에는 배너가 없다', async () => {
    await loadPage();

    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '지정하러 가기' }),
    ).not.toBeInTheDocument();
  });

  it('"지정하러 가기" 는 "카테고리 변경" 선택으로 포커스를 옮기고 그 요소로 스크롤한다', async () => {
    await loadUncategorized();
    const go = screen.getByRole('button', { name: '지정하러 가기' });
    go.focus();

    fireEvent.click(go);

    expect(categorySelect()).toHaveFocus();
    expect(scrolledElements()).toContain(categorySelect());
  });

  it('aria-disabled 인 "답변 등록" 을 눌러도 같다 (미리보기는 열리지 않는다)', async () => {
    await loadUncategorized();
    typeReply(BODY);
    replyButton().focus();

    fireEvent.click(replyButton());

    expect(categorySelect()).toHaveFocus();
    expect(scrolledElements()).toContain(categorySelect());
    expect(queryPreviewDialog()).not.toBeInTheDocument();
    expect(replyAdminInquiry).not.toHaveBeenCalled();
  });

  it('카테고리를 저장하면 배너가 사라지고 등록할 수 있다', async () => {
    const { client } = await loadUncategorized();
    typeReply(BODY);
    expect(screen.getByText(BANNER)).toBeVisible();

    choose(categorySelect(), '오류 신고');
    fireEvent.click(categorySaveButton());

    await waitFor(() =>
      expect(screen.queryByText(BANNER)).not.toBeInTheDocument(),
    );
    await waitForIdle(client);
    expect(
      screen.queryByRole('button', { name: '지정하러 가기' }),
    ).not.toBeInTheDocument();
    expect(isAriaDisabled(replyButton())).toBe(false);
  });
});

describe('답변 등록 - 충돌 뒤 새로고침 후속 안내', () => {
  const INFO = '새 답변이 등록됐어요. 내용을 확인한 뒤 등록하세요.';

  const makeConflict = () =>
    vi.mocked(replyAdminInquiry).mockImplementationOnce((async () => {
      server.messages.push(OTHER_REPLY);
      server.inquiry.status = 'answered';
      server.inquiry.updatedAt = '2026-10-01T05:30:00Z';
      throw { code: 'P0001', message: 'conflict' };
    }) as never);

  const reachConflict = async () => {
    const view = await loadPage();

    attach(view.container, [makeFile('a.png')]);
    makeConflict();
    submitReply(BODY);
    await screen.findByRole('alert');
    await waitForIdle(view.client);
    await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(false));

    return view;
  };

  const otherReplyCard = () =>
    screen.findByRole('article', { name: /운영자 답변 · 10\.01 14:30/ });

  it('"새로고침" 이 끝나면 alert 가 평문 안내로 바뀌고 새 답변 카드로 스크롤하며 초안과 사진은 남는다', async () => {
    const { client } = await reachConflict();
    const card = await otherReplyCard();
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));

    const info = await screen.findByText(INFO);
    await waitForIdle(client);
    expect(info).toBeVisible();
    expect(info.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(alerts()).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: '새로고침' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    await waitFor(() => expect(wasScrolledTo(card)).toBe(true));
    expect(
      wasScrolledTo(screen.getByRole('article', { name: /내부 메모/ })),
    ).toBe(false);
    expect(replyBox()).toHaveValue(BODY);
    expect(deletePhotoButton('a.png')).toBeInTheDocument();
  });

  it('새로고침을 누르기 전에는 alert 가 그대로고 평문 안내는 없다', async () => {
    await reachConflict();

    expect(screen.getByRole('alert')).toHaveTextContent(CONFLICT_TEXT);
    expect(screen.queryByText(INFO)).not.toBeInTheDocument();
  });

  it('다시 등록에 성공하면 평문 안내가 사라진다', async () => {
    const { client } = await reachConflict();
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));
    await screen.findByText(INFO);
    await waitForIdle(client);
    await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(false));

    submitReply(BODY);

    await waitFor(() =>
      expect(screen.queryByText(INFO)).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(2));
    await waitForIdle(client);
    expect(alerts()).toHaveLength(0);
  });

  it('화면에서 감지한 충돌(미리보기 스냅샷 불일치)도 같은 후속 안내를 한다', async () => {
    const { client } = await loadPage();
    openPreview(BODY);
    server.messages.push(OTHER_REPLY);
    server.inquiry.updatedAt = '2026-10-01T05:30:00Z';
    await act(async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: adminQueryKeys.inquiry(INQUIRY_ID),
        }),
        client.invalidateQueries({
          queryKey: adminQueryKeys.messages(INQUIRY_ID),
        }),
      ]);
    });
    await waitForIdle(client);
    confirmReply();
    await screen.findByRole('alert');
    await waitForIdle(client);
    const card = await otherReplyCard();
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));

    expect(await screen.findByText(INFO)).toBeVisible();
    await waitFor(() => expect(wasScrolledTo(card)).toBe(true));
    expect(alerts()).toHaveLength(0);
    await flush();
  });
});
