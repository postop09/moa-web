import type { ReactNode } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { updateAdminInquiryMeta } from '@/entities/admin';
import { adminQueryKeys } from '@/features/adminInquiry';
import { useToast } from '@/shared/ui';

import {
  INQUIRY_ID,
  NOW,
  QUESTION,
  REPLY,
  assigneeSelect,
  changeServerInquiry,
  choose,
  createServer,
  describedText,
  fireBeforeUnload,
  installCurrentUser,
  installScrollSpy,
  installServer,
  isAriaDisabled,
  renderPage,
  statusCancelButton,
  statusSaveButton,
  statusSelect,
  statusText,
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

let server: Server;

const SAVED_TEXT = '저장했어요';
const DIRTY_HINT = '저장하지 않은 변경이 있어요';
const RESET_NOTE = '다른 곳에서 변경돼 입력을 초기화했어요';

const loadPage = async () => {
  const view = renderPage();

  await waitForPage();
  await waitForIdle(view.client);
  await waitFor(() =>
    expect(
      within(assigneeSelect()).getByRole('option', { name: 'opa@moa.test' }),
    ).toBeInTheDocument(),
  );

  return view;
};

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const isPlain = (element: HTMLElement) =>
  element.closest('[role="status"], [role="alert"], [aria-live]') === null;

const saveStatus = async (client: Parameters<typeof waitForIdle>[0]) => {
  choose(statusSelect(), '답변 대기');
  fireEvent.click(statusSaveButton());
  await waitForStatus('상태·담당자를 저장했어요');
  await waitForIdle(client);
};

const refetchInquiry = async (client: {
  invalidateQueries: (filters: {
    queryKey: readonly unknown[];
  }) => Promise<void>;
}) => {
  await act(async () => {
    await client.invalidateQueries({
      queryKey: adminQueryKeys.inquiry(INQUIRY_ID),
    });
  });
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
  server = createServer({ messages: [QUESTION, REPLY] });
  installServer(server);
  installCurrentUser();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('상태·담당자 - "저장했어요" 피드백 수명', () => {
  it('4초 뒤에 사라진다 (그 전에는 남아 있다)', async () => {
    const { client } = await loadPage();

    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    choose(statusSelect(), '답변 대기');
    fireEvent.click(statusSaveButton());
    await advance(500);

    expect(screen.getByText(SAVED_TEXT)).toBeVisible();

    await advance(3000);
    expect(screen.getByText(SAVED_TEXT)).toBeVisible();

    await advance(1500);
    expect(screen.queryByText(SAVED_TEXT)).not.toBeInTheDocument();
    expect(client.isMutating()).toBe(0);
  });

  it('상태 선택을 다시 바꾸면 즉시 사라진다', async () => {
    const { client } = await loadPage();
    await saveStatus(client);
    expect(screen.getByText(SAVED_TEXT)).toBeVisible();

    choose(statusSelect(), '처리 중');

    expect(screen.queryByText(SAVED_TEXT)).not.toBeInTheDocument();
  });

  it('담당자 선택을 다시 바꿔도 즉시 사라진다', async () => {
    const { client } = await loadPage();
    await saveStatus(client);
    expect(screen.getByText(SAVED_TEXT)).toBeVisible();

    choose(assigneeSelect(), 'opa@moa.test');

    expect(screen.queryByText(SAVED_TEXT)).not.toBeInTheDocument();
  });

  it('평문이다 (알림 영역·alert·live 영역 안이 아니다)', async () => {
    const { client } = await loadPage();
    await saveStatus(client);

    expect(isPlain(screen.getByText(SAVED_TEXT))).toBe(true);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});

describe('상태·담당자 - 저장하지 않은 변경 안내', () => {
  it('서버 값과 같으면 보이지 않는다', async () => {
    await loadPage();

    expect(screen.queryByText(DIRTY_HINT)).not.toBeInTheDocument();
  });

  it.each([
    ['상태', () => choose(statusSelect(), '답변 대기')],
    ['담당자', () => choose(assigneeSelect(), 'opa@moa.test')],
  ])('%s 초안이 서버 값과 다르면 평문으로 보인다', async (_name, edit) => {
    await loadPage();

    edit();

    const hint = screen.getByText(DIRTY_HINT);

    expect(hint).toBeVisible();
    expect(isPlain(hint)).toBe(true);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('"저장" 버튼의 aria-describedby 로 연결된다', async () => {
    await loadPage();

    choose(statusSelect(), '답변 대기');

    expect(describedText(statusSaveButton())).toContain(DIRTY_HINT);
  });

  it('초안을 서버 값으로 되돌리면 사라지고 연결도 끊긴다', async () => {
    await loadPage();
    choose(statusSelect(), '답변 대기');
    expect(screen.getByText(DIRTY_HINT)).toBeVisible();

    choose(statusSelect(), '처리 중');

    expect(screen.queryByText(DIRTY_HINT)).not.toBeInTheDocument();
    expect(describedText(statusSaveButton())).not.toContain(DIRTY_HINT);
  });

  it('저장에 성공하면 사라진다', async () => {
    const { client } = await loadPage();
    choose(statusSelect(), '답변 대기');

    fireEvent.click(statusSaveButton());
    await waitForStatus('상태·담당자를 저장했어요');
    await waitForIdle(client);

    expect(screen.queryByText(DIRTY_HINT)).not.toBeInTheDocument();
  });

  it('저장에 실패하면 초안이 남으므로 계속 보인다', async () => {
    const { client } = await loadPage();
    vi.mocked(updateAdminInquiryMeta).mockRejectedValue(new Error('boom'));
    choose(statusSelect(), '답변 대기');

    fireEvent.click(statusSaveButton());
    await screen.findByRole('alert');
    await waitForIdle(client);

    expect(screen.getByText(DIRTY_HINT)).toBeVisible();
  });

  it('취소하면 사라진다', async () => {
    await loadPage();
    choose(assigneeSelect(), 'opa@moa.test');
    expect(screen.getByText(DIRTY_HINT)).toBeVisible();

    fireEvent.click(statusCancelButton());

    expect(screen.queryByText(DIRTY_HINT)).not.toBeInTheDocument();
  });
});

describe('상태·담당자 - 이탈 가드 (beforeunload)', () => {
  it('초안이 없으면 막지 않는다', async () => {
    await loadPage();

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it.each([
    ['상태', () => choose(statusSelect(), '답변 대기')],
    ['담당자', () => choose(assigneeSelect(), 'opa@moa.test')],
  ])('%s 초안이 있으면 막는다', async (_name, edit) => {
    await loadPage();

    edit();

    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('초안을 서버 값으로 되돌리면 다시 풀린다', async () => {
    await loadPage();
    choose(statusSelect(), '답변 대기');
    expect(fireBeforeUnload().defaultPrevented).toBe(true);

    choose(statusSelect(), '처리 중');

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('저장에 성공하면 막지 않는다', async () => {
    const { client } = await loadPage();
    choose(statusSelect(), '답변 대기');
    expect(fireBeforeUnload().defaultPrevented).toBe(true);

    fireEvent.click(statusSaveButton());
    await waitForStatus('상태·담당자를 저장했어요');
    await waitForIdle(client);

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('저장에 실패하면 초안이 남으므로 계속 막는다', async () => {
    const { client } = await loadPage();
    vi.mocked(updateAdminInquiryMeta).mockRejectedValue(new Error('boom'));
    choose(statusSelect(), '답변 대기');

    fireEvent.click(statusSaveButton());
    await screen.findByRole('alert');
    await waitForIdle(client);

    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('취소하면 막지 않는다', async () => {
    await loadPage();
    choose(assigneeSelect(), 'opa@moa.test');
    expect(fireBeforeUnload().defaultPrevented).toBe(true);

    fireEvent.click(statusCancelButton());

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('언마운트하면 리스너가 제거된다', async () => {
    const { unmount } = await loadPage();
    choose(statusSelect(), '답변 대기');

    unmount();

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});

describe('상태·담당자 - 서버 값이 바뀌면 초안을 버린다', () => {
  const startDraft = async () => {
    const view = await loadPage();

    choose(statusSelect(), '답변 대기');
    choose(assigneeSelect(), 'opa@moa.test');
    expect(screen.getByText(DIRTY_HINT)).toBeVisible();

    return view;
  };

  // 담당 운영자(opb)가 답변해 서버 상태가 "답변 완료" 가 됐다.
  const otherOperatorAnswers = () =>
    changeServerInquiry(server, { status: 'answered' });

  it('updatedAt 이 달라지면 두 선택이 새 서버 값을 보이고 힌트가 사라진다', async () => {
    const { client } = await startDraft();
    otherOperatorAnswers();

    await refetchInquiry(client);
    await waitForIdle(client);

    await waitFor(() => expect(statusSelect()).toHaveDisplayValue('답변 완료'));
    expect(assigneeSelect()).toHaveDisplayValue('opb@moa.test');
    expect(screen.queryByText(DIRTY_HINT)).not.toBeInTheDocument();
    expect(isAriaDisabled(statusSaveButton())).toBe(true);
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('초안을 버렸다는 평문 안내를 한 번 보인다', async () => {
    const { client } = await startDraft();
    otherOperatorAnswers();

    await refetchInquiry(client);
    await waitForIdle(client);

    const note = await screen.findByText(RESET_NOTE);

    expect(note).toBeVisible();
    expect(isPlain(note)).toBe(true);
    expect(screen.getAllByText(RESET_NOTE)).toHaveLength(1);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(statusText()).toBe('');
  });

  it('다음 편집(상태든 담당자든)을 하면 안내가 사라진다', async () => {
    const { client } = await startDraft();
    otherOperatorAnswers();
    await refetchInquiry(client);
    await waitForIdle(client);
    await screen.findByText(RESET_NOTE);

    choose(statusSelect(), '답변 대기');

    expect(screen.queryByText(RESET_NOTE)).not.toBeInTheDocument();
    expect(screen.getByText(DIRTY_HINT)).toBeVisible();
  });

  it('새 서버 값 위에서 다시 편집하면 새 초안이 기준이 된다', async () => {
    const { client } = await startDraft();
    changeServerInquiry(server, {
      status: 'waiting',
      assigneeId: 'op-1',
      assigneeEmail: 'opa@moa.test',
    });
    await refetchInquiry(client);
    await waitForIdle(client);
    await screen.findByText(RESET_NOTE);

    choose(statusSelect(), '처리 중');
    fireEvent.click(statusSaveButton());
    await waitFor(() =>
      expect(updateAdminInquiryMeta).toHaveBeenCalledTimes(1),
    );
    await waitForIdle(client);

    // 바꾼 상태만 보낸다 (담당자는 서버 값 그대로).
    expect(vi.mocked(updateAdminInquiryMeta).mock.calls[0][1]).toEqual(
      expect.objectContaining({ inquiryId: INQUIRY_ID, status: 'in_progress' }),
    );
    expect(
      vi.mocked(updateAdminInquiryMeta).mock.calls[0][1],
    ).not.toHaveProperty('assigneeId');
  });

  it('updatedAt 이 같은 새로고침은 초안을 유지하고 안내도 없다', async () => {
    const { client } = await startDraft();

    await refetchInquiry(client);
    await waitForIdle(client);

    expect(statusSelect()).toHaveDisplayValue('답변 대기');
    expect(assigneeSelect()).toHaveDisplayValue('opa@moa.test');
    expect(screen.getByText(DIRTY_HINT)).toBeVisible();
    expect(screen.queryByText(RESET_NOTE)).not.toBeInTheDocument();
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('초안이 없을 때 서버 값이 바뀌어도 안내하지 않는다', async () => {
    const { client } = await loadPage();
    otherOperatorAnswers();

    await refetchInquiry(client);
    await waitForIdle(client);

    await waitFor(() => expect(statusSelect()).toHaveDisplayValue('답변 완료'));
    expect(screen.queryByText(RESET_NOTE)).not.toBeInTheDocument();
  });

  it('내가 저장해서 서버가 바뀐 경우에는 초기화 안내가 없다', async () => {
    const { client } = await loadPage();

    await saveStatus(client);
    await refetchInquiry(client);
    await waitForIdle(client);

    expect(screen.queryByText(RESET_NOTE)).not.toBeInTheDocument();
    expect(statusSelect()).toHaveDisplayValue('답변 대기');
  });
});
