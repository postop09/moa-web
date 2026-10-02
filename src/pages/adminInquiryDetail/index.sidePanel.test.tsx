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
  getAdminUserRecentInquiries,
  openAdminInquiry,
  updateAdminInquiryMeta,
} from '@/entities/admin';
import { useToast } from '@/shared/ui';

import {
  INQUIRY_ID,
  NETWORK_TEXT,
  NOW,
  PERMISSION_TEXT,
  QUESTION,
  REPLY,
  SUPABASE,
  assigneeSelect,
  categoryCancelButton,
  categoryChangeButton,
  categorySaveButton,
  categorySelect,
  choose,
  createServer,
  definitionOf,
  deferred,
  flush,
  installScrollSpy,
  installServer,
  isAriaDisabled,
  renderPage,
  statusCancelButton,
  statusSaveButton,
  statusSelect,
  statusText,
  describedText,
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

vi.mock('@/entities/inquiry', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  deleteInquiryAttachments: vi.fn(),
  getAttachmentUrls: vi.fn(),
  uploadInquiryAttachment: vi.fn(),
}));

let server: Server;

const loadPage = async () => {
  const view = renderPage();

  await waitForPage();
  await waitForIdle(view.client);

  return view;
};

const alerts = () => screen.queryAllByRole('alert');
const toastMessage = () => useToast.getState().message;

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
});

afterEach(() => {
  vi.useRealTimers();
});

const PANEL_FAILURE_TEXT = '변경하지 못했어요. 다시 시도해주세요.';
const INVALID_STATE_TEXT = '이미 종결된 문의예요.';

const PANEL_FAILURES: [string, unknown, string][] = [
  ['네트워크', new TypeError('Failed to fetch'), NETWORK_TEXT],
  ['forbidden', { code: 'P0001', message: 'forbidden' }, PERMISSION_TEXT],
  [
    'invalid_state',
    { code: 'P0001', message: 'invalid_state' },
    INVALID_STATE_TEXT,
  ],
  ['그 밖의 오류', new Error('boom'), PANEL_FAILURE_TEXT],
  [
    '서버 원문',
    { code: 'XX000', message: 'secret internal detail' },
    PANEL_FAILURE_TEXT,
  ],
];

const optionNames = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .map((option) => option.textContent);

describe('사이드 패널 - 카테고리', () => {
  it('"카테고리 · Jev 분류" 아래 현재 카테고리와 "신뢰도 0.88" 을 보인다', async () => {
    await loadPage();

    expect(screen.getByText('카테고리 · Jev 분류')).toBeInTheDocument();
    expect(visibleLabels('계정·로그인').length).toBeGreaterThan(0);
    expect(screen.getByText(/신뢰도 0\.88/)).toBeInTheDocument();
  });

  it('신뢰도는 소수 둘째 자리로 맞추고, 없으면 신뢰도 줄을 보이지 않는다', async () => {
    server = createServer({ inquiry: { categoryConfidence: 0.5 } });
    installServer(server);
    const first = await loadPage();
    expect(screen.getByText(/신뢰도 0\.50/)).toBeInTheDocument();
    first.unmount();

    server = createServer({ inquiry: { categoryConfidence: null } });
    installServer(server);
    await loadPage();

    expect(screen.queryByText(/신뢰도/)).not.toBeInTheDocument();
  });

  it('"변경" 을 누르면 "카테고리 변경" 선택과 "저장" / "취소" 가 나타난다', async () => {
    await loadPage();
    expect(screen.queryByLabelText('카테고리 변경')).not.toBeInTheDocument();

    fireEvent.click(categoryChangeButton());

    expect(categorySelect()).toHaveDisplayValue('계정·로그인');
    expect(optionNames(categorySelect())).toEqual(
      expect.arrayContaining([
        '공유 가계부',
        '기록·카테고리',
        '통계·화면',
        '계정·로그인',
        '오류 신고',
        '기능 제안',
        '기타',
      ]),
    );
    expect(categorySaveButton()).toBeInTheDocument();
    expect(categoryCancelButton()).toBeInTheDocument();
  });

  it('"취소" 는 선택을 접고 아무것도 저장하지 않으며 포커스를 "변경" 으로 돌려준다', async () => {
    await loadPage();
    fireEvent.click(categoryChangeButton());
    choose(categorySelect(), '오류 신고');

    fireEvent.click(categoryCancelButton());

    expect(screen.queryByLabelText('카테고리 변경')).not.toBeInTheDocument();
    expect(updateAdminInquiryMeta).not.toHaveBeenCalled();
    expect(categoryChangeButton()).toHaveFocus();
    expect(visibleLabels('계정·로그인').length).toBeGreaterThan(0);
  });

  it('"저장" 은 category 만 담아 updateAdminInquiryMeta 를 호출한다', async () => {
    await loadPage();
    fireEvent.click(categoryChangeButton());
    choose(categorySelect(), '오류 신고');

    fireEvent.click(categorySaveButton());

    await waitFor(() =>
      expect(updateAdminInquiryMeta).toHaveBeenCalledWith(SUPABASE, {
        inquiryId: INQUIRY_ID,
        category: 'bug_report',
      }),
    );
    expect(updateAdminInquiryMeta).toHaveBeenCalledTimes(1);
  });

  it('성공하면 선택이 접히고 새 카테고리를 보이며, "카테고리를 변경했어요" 를 한 번 알리고 "변경" 으로 포커스를 돌린다 (토스트 없음)', async () => {
    const { client } = await loadPage();
    fireEvent.click(categoryChangeButton());
    choose(categorySelect(), '오류 신고');

    fireEvent.click(categorySaveButton());

    await waitForStatus('카테고리를 변경했어요');
    await waitForIdle(client);
    expect(statusText()).toBe('카테고리를 변경했어요');
    expect(screen.queryByLabelText('카테고리 변경')).not.toBeInTheDocument();
    expect(visibleLabels('오류 신고').length).toBeGreaterThan(0);
    await waitFor(() => expect(categoryChangeButton()).toHaveFocus());
    expect(toastMessage()).toBeNull();
    expect(alerts()).toHaveLength(0);
  });

  it('같은 tick 에 "저장" 을 두 번 눌러도 한 번만 호출한다', async () => {
    await loadPage();
    fireEvent.click(categoryChangeButton());
    choose(categorySelect(), '오류 신고');
    const gate = deferred();
    vi.mocked(updateAdminInquiryMeta).mockReturnValue(gate.promise);
    const save = categorySaveButton();

    await act(async () => {
      fireEvent.click(save);
      fireEvent.click(save);
    });
    gate.resolve();

    await waitFor(() =>
      expect(updateAdminInquiryMeta).toHaveBeenCalledTimes(1),
    );
  });

  it.each(PANEL_FAILURES)(
    '%s 실패는 패널의 단일 인라인 alert 로 알리고 성공 안내는 하지 않는다',
    async (_name, error, text) => {
      const { client } = await loadPage();
      fireEvent.click(categoryChangeButton());
      choose(categorySelect(), '오류 신고');
      vi.mocked(updateAdminInquiryMeta).mockRejectedValue(error);

      fireEvent.click(categorySaveButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(text);
      await waitForIdle(client);
      expect(alerts()).toHaveLength(1);
      expect(statusText()).toBe('');
      expect(toastMessage()).toBeNull();
      expect(document.body).not.toHaveTextContent('secret internal detail');
    },
  );

  describe('미분류 문의', () => {
    beforeEach(() => {
      server = createServer({
        messages: [QUESTION],
        inquiry: { category: null, categoryConfidence: null },
      });
      installServer(server);
    });

    it('"미분류" 와 펼쳐진 선택을 보인다 (옛 안내 "답변 전에 카테고리를 지정해야 해요" 는 답변 영역 배너로 일원화돼 없다)', async () => {
      await loadPage();

      expect(visibleLabels('미분류').length).toBeGreaterThan(0);
      expect(categorySelect()).toBeInTheDocument();
      expect(
        screen.queryByText('답변 전에 카테고리를 지정해야 해요'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/신뢰도/)).not.toBeInTheDocument();
    });

    it('카테고리를 고르기 전에는 "저장" 이 aria-disabled 다', async () => {
      await loadPage();
      const save = categorySaveButton();

      expect(isAriaDisabled(save)).toBe(true);
      fireEvent.click(save);
      expect(updateAdminInquiryMeta).not.toHaveBeenCalled();

      choose(categorySelect(), '기능 제안');

      expect(isAriaDisabled(save)).toBe(false);
    });

    it('저장하면 안내가 사라지고 선택이 접히며 "변경" 으로 포커스가 간다', async () => {
      const { client } = await loadPage();
      choose(categorySelect(), '기능 제안');

      fireEvent.click(categorySaveButton());

      await waitForStatus('카테고리를 변경했어요');
      await waitForIdle(client);
      expect(
        screen.queryByText('답변 전에 카테고리를 지정해야 해요'),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText('카테고리 변경')).not.toBeInTheDocument();
      expect(visibleLabels('기능 제안').length).toBeGreaterThan(0);
      await waitFor(() => expect(categoryChangeButton()).toHaveFocus());
    });
  });
});

describe('사이드 패널 - 카테고리 편집 포커스', () => {
  it('"변경" 을 누르면 포커스가 <body> 로 떨어지지 않고 "카테고리 변경" 선택으로 간다', async () => {
    await loadPage();
    categoryChangeButton().focus();

    fireEvent.click(categoryChangeButton());

    expect(categorySelect()).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
  });
});

const waitForOperators = () =>
  waitFor(() =>
    expect(
      within(assigneeSelect()).getByRole('option', { name: 'opa@moa.test' }),
    ).toBeInTheDocument(),
  );

const SAVED_TEXT = '저장했어요';
const SAVED_ANNOUNCEMENT = '상태·담당자를 저장했어요';

describe('사이드 패널 - 상태', () => {
  it('답변 대기 / 처리 중 만 고를 수 있고 현재 값(처리 중)이 선택돼 있다', async () => {
    await loadPage();

    expect(statusSelect()).toHaveDisplayValue('처리 중');
    expect(optionNames(statusSelect())).toEqual(['답변 대기', '처리 중']);
    expect(isAriaDisabled(statusSelect())).toBe(false);
  });

  it('답변 완료 는 현재 값일 때만 disabled 옵션으로 나타난다 (종결은 없다)', async () => {
    server = createServer({ inquiry: { status: 'answered' } });
    installServer(server);
    await loadPage();

    expect(statusSelect()).toHaveDisplayValue('답변 완료');
    const answered = within(statusSelect()).getByRole('option', {
      name: '답변 완료',
    });
    expect(answered).toBeDisabled();
    expect(
      within(statusSelect()).getByRole('option', { name: '답변 대기' }),
    ).toBeEnabled();
    expect(
      within(statusSelect()).getByRole('option', { name: '처리 중' }),
    ).toBeEnabled();
    expect(
      within(statusSelect()).queryByRole('option', { name: '종결' }),
    ).not.toBeInTheDocument();
  });

  it('종결된 문의에서는 aria-disabled 이고 이유 안내가 연결되며 현재 값 "종결" 만 보인다', async () => {
    server = createServer({
      messages: [QUESTION],
      inquiry: { status: 'closed', closeReason: '테스트' },
    });
    installServer(server);
    await loadPage();

    expect(isAriaDisabled(statusSelect())).toBe(true);
    expect(statusSelect()).not.toBeDisabled();
    expect(statusSelect()).toHaveDisplayValue('종결');
    expect(
      within(statusSelect()).getByRole('option', { name: '종결' }),
    ).toBeDisabled();
    expect(describedText(statusSelect())).not.toBe('');
    expect(updateAdminInquiryMeta).not.toHaveBeenCalled();
  });
});

describe('사이드 패널 - 담당자', () => {
  it('운영자 목록(이메일)을 보이고 현재 담당자가 선택돼 있으며 "미지정" 으로 되돌릴 수는 없다', async () => {
    await loadPage();

    await waitFor(() =>
      expect(optionNames(assigneeSelect())).toEqual(
        expect.arrayContaining(['opa@moa.test', 'opb@moa.test']),
      ),
    );
    expect(assigneeSelect()).toHaveDisplayValue('opb@moa.test');
    expect(
      within(assigneeSelect()).queryByRole('option', { name: '미지정' }),
    ).not.toBeInTheDocument();
  });

  it('담당자가 없으면 "미지정" 이 disabled 자리표시 옵션으로 선택돼 있다', async () => {
    server = createServer({
      inquiry: { assigneeId: null, assigneeEmail: null },
    });
    installServer(server);
    await loadPage();

    expect(assigneeSelect()).toHaveDisplayValue('미지정');
    expect(
      within(assigneeSelect()).getByRole('option', { name: '미지정' }),
    ).toBeDisabled();
  });

  it('종결된 문의에서는 aria-disabled 다', async () => {
    server = createServer({
      messages: [QUESTION],
      inquiry: { status: 'closed', closeReason: '테스트' },
    });
    installServer(server);
    await loadPage();

    expect(isAriaDisabled(assigneeSelect())).toBe(true);
    expect(assigneeSelect()).not.toBeDisabled();
  });

  it('종결된 문의에서는 카테고리 "변경" 도 aria-disabled 이고 눌러도 선택이 열리지 않는다', async () => {
    server = createServer({
      messages: [QUESTION],
      inquiry: { status: 'closed', closeReason: '테스트' },
    });
    installServer(server);
    await loadPage();

    expect(isAriaDisabled(categoryChangeButton())).toBe(true);
    fireEvent.click(categoryChangeButton());

    expect(screen.queryByLabelText('카테고리 변경')).not.toBeInTheDocument();
  });
});

describe('사이드 패널 - 상태·담당자 저장 단계', () => {
  it('선택을 바꿔도 요청하지 않고 초안 값만 바뀐다 (방향키처럼 change 가 이어져도)', async () => {
    await loadPage();
    await waitForOperators();

    choose(statusSelect(), '답변 대기');
    choose(statusSelect(), '처리 중');
    choose(statusSelect(), '답변 대기');
    choose(assigneeSelect(), 'opa@moa.test');
    await flush();

    expect(statusSelect()).toHaveDisplayValue('답변 대기');
    expect(assigneeSelect()).toHaveDisplayValue('opa@moa.test');
    expect(updateAdminInquiryMeta).not.toHaveBeenCalled();
    expect(statusText()).toBe('');
  });

  it('"저장" 과 "취소" 는 선택 아래에 한 쌍으로 있다', async () => {
    await loadPage();

    const save = statusSaveButton();
    const cancel = statusCancelButton();
    const follows = (a: HTMLElement, b: HTMLElement) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(follows(statusSelect(), save)).toBe(true);
    expect(follows(assigneeSelect(), save)).toBe(true);
    expect(follows(statusSelect(), cancel)).toBe(true);
  });

  it('서버 값과 같으면 "저장" 은 aria-disabled 이고 눌러도 요청하지 않는다. 다르게 고르면 풀리고 되돌리면 다시 막힌다', async () => {
    await loadPage();
    expect(isAriaDisabled(statusSaveButton())).toBe(true);
    expect(statusSaveButton()).not.toBeDisabled();
    fireEvent.click(statusSaveButton());
    await flush();
    expect(updateAdminInquiryMeta).not.toHaveBeenCalled();

    choose(statusSelect(), '답변 대기');
    expect(isAriaDisabled(statusSaveButton())).toBe(false);

    choose(statusSelect(), '처리 중');
    expect(isAriaDisabled(statusSaveButton())).toBe(true);
    fireEvent.click(statusSaveButton());
    await flush();
    expect(updateAdminInquiryMeta).not.toHaveBeenCalled();
  });

  it.each([
    ['상태만', { status: 'waiting' }],
    ['담당자만', { assigneeId: 'op-1' }],
    ['둘 다', { status: 'waiting', assigneeId: 'op-1' }],
  ])('%s 바꾸면 바뀐 항목만 담아 한 번 호출한다', async (_name, expected) => {
    await loadPage();
    await waitForOperators();
    if ('status' in expected) choose(statusSelect(), '답변 대기');
    if ('assigneeId' in expected) choose(assigneeSelect(), 'opa@moa.test');

    fireEvent.click(statusSaveButton());

    await waitFor(() =>
      expect(updateAdminInquiryMeta).toHaveBeenCalledWith(SUPABASE, {
        inquiryId: INQUIRY_ID,
        ...expected,
      }),
    );
    expect(updateAdminInquiryMeta).toHaveBeenCalledTimes(1);
  });

  it('같은 tick 에 "저장" 을 두 번 눌러도 한 번만 호출한다', async () => {
    await loadPage();
    choose(statusSelect(), '답변 대기');
    const gate = deferred();
    vi.mocked(updateAdminInquiryMeta).mockReturnValue(gate.promise);
    const save = statusSaveButton();

    await act(async () => {
      fireEvent.click(save);
      fireEvent.click(save);
    });
    gate.resolve();

    await waitFor(() =>
      expect(updateAdminInquiryMeta).toHaveBeenCalledTimes(1),
    );
  });

  it('요청 중에는 선택과 버튼이 aria-disabled 이고 묶음이 aria-busy 이며, 그동안의 변경은 조용히 버려지지 않고 무시된다', async () => {
    const { client } = await loadPage();
    await waitForOperators();
    choose(statusSelect(), '답변 대기');
    const gate = deferred();
    vi.mocked(updateAdminInquiryMeta).mockReturnValue(gate.promise);
    expect(statusSelect().closest('[aria-busy="true"]')).toBeNull();

    fireEvent.click(statusSaveButton());

    await waitFor(() => expect(updateAdminInquiryMeta).toHaveBeenCalled());
    await waitFor(() => expect(isAriaDisabled(statusSelect())).toBe(true));
    expect(isAriaDisabled(assigneeSelect())).toBe(true);
    expect(isAriaDisabled(statusSaveButton())).toBe(true);
    expect(isAriaDisabled(statusCancelButton())).toBe(true);
    expect(statusSelect().closest('[aria-busy="true"]')).not.toBeNull();
    expect(statusSelect()).not.toBeDisabled();

    choose(statusSelect(), '처리 중');
    choose(assigneeSelect(), 'opa@moa.test');
    fireEvent.click(statusCancelButton());
    fireEvent.click(statusSaveButton());
    await flush();

    expect(statusSelect()).toHaveDisplayValue('답변 대기');
    expect(assigneeSelect()).toHaveDisplayValue('opb@moa.test');
    expect(updateAdminInquiryMeta).toHaveBeenCalledTimes(1);

    gate.resolve();
    await waitForIdle(client);

    expect(isAriaDisabled(statusSelect())).toBe(false);
    expect(isAriaDisabled(assigneeSelect())).toBe(false);
    expect(statusSelect().closest('[aria-busy="true"]')).toBeNull();
  });

  describe('성공', () => {
    const saveStatus = async () => {
      const view = await loadPage();

      choose(statusSelect(), '답변 대기');
      fireEvent.click(statusSaveButton());
      await waitForStatus(SAVED_ANNOUNCEMENT);
      await waitForIdle(view.client);

      return view;
    };

    it('초안이 새 서버 값으로 맞춰지고 헤더 라벨이 반영되며 "저장" 은 다시 aria-disabled 다', async () => {
      await saveStatus();

      expect(statusSelect()).toHaveDisplayValue('답변 대기');
      expect(visibleLabels('답변 대기').length).toBeGreaterThan(0);
      expect(isAriaDisabled(statusSaveButton())).toBe(true);
      expect(isAriaDisabled(statusSelect())).toBe(false);
    });

    it('"상태·담당자를 저장했어요" 를 한 번만 알리고 토스트는 없다', async () => {
      await saveStatus();

      expect(statusText()).toBe(SAVED_ANNOUNCEMENT);
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(toastMessage()).toBeNull();
      expect(alerts()).toHaveLength(0);
    });

    it('눈에 보이는 평문 "저장했어요" 가 나타나고 알림 영역이 아니다', async () => {
      await saveStatus();

      const text = screen.getByText(SAVED_TEXT);

      expect(text).toBeVisible();
      expect(text.closest('[role="status"], [role="alert"]')).toBeNull();
    });

    it('담당자만 바꿔도 같은 알림과 평문을 보인다', async () => {
      const { client } = await loadPage();
      await waitForOperators();

      choose(assigneeSelect(), 'opa@moa.test');
      fireEvent.click(statusSaveButton());

      await waitForStatus(SAVED_ANNOUNCEMENT);
      await waitForIdle(client);
      expect(assigneeSelect()).toHaveDisplayValue('opa@moa.test');
      expect(screen.getByText(SAVED_TEXT)).toBeVisible();
    });

    it('운영자가 직접 "답변 대기" 로 되돌려도 자동 열기를 다시 하지 않는다', async () => {
      await saveStatus();

      expect(openAdminInquiry).not.toHaveBeenCalled();
    });
  });

  describe('실패', () => {
    it.each(PANEL_FAILURES)(
      '%s: 패널의 단일 인라인 alert 로 알리고 초안은 그대로 두며 성공 안내는 하지 않는다',
      async (_name, error, text) => {
        const { client } = await loadPage();
        await waitForOperators();
        vi.mocked(updateAdminInquiryMeta).mockRejectedValue(error);
        choose(statusSelect(), '답변 대기');
        choose(assigneeSelect(), 'opa@moa.test');

        fireEvent.click(statusSaveButton());

        expect(await screen.findByRole('alert')).toHaveTextContent(text);
        await waitForIdle(client);
        expect(alerts()).toHaveLength(1);
        expect(statusSelect()).toHaveDisplayValue('답변 대기');
        expect(assigneeSelect()).toHaveDisplayValue('opa@moa.test');
        expect(isAriaDisabled(statusSaveButton())).toBe(false);
        expect(isAriaDisabled(statusSelect())).toBe(false);
        expect(statusText()).toBe('');
        expect(screen.queryByText(SAVED_TEXT)).not.toBeInTheDocument();
        expect(toastMessage()).toBeNull();
        expect(document.body).not.toHaveTextContent('secret internal detail');
      },
    );

    it('다시 저장을 시작하면 이전 alert 는 사라지고, 성공하면 저장 안내를 한다', async () => {
      const { client } = await loadPage();
      vi.mocked(updateAdminInquiryMeta).mockRejectedValueOnce(
        new Error('boom'),
      );
      choose(statusSelect(), '답변 대기');
      fireEvent.click(statusSaveButton());
      await screen.findByRole('alert');
      await waitForIdle(client);

      fireEvent.click(statusSaveButton());

      await waitForStatus(SAVED_ANNOUNCEMENT);
      await waitForIdle(client);
      expect(alerts()).toHaveLength(0);
      expect(updateAdminInquiryMeta).toHaveBeenCalledTimes(2);
    });
  });

  describe('취소', () => {
    it('호출 없이 선택을 서버 값으로 되돌리고 "저장" 은 다시 aria-disabled 다', async () => {
      await loadPage();
      await waitForOperators();
      choose(statusSelect(), '답변 대기');
      choose(assigneeSelect(), 'opa@moa.test');

      fireEvent.click(statusCancelButton());

      expect(statusSelect()).toHaveDisplayValue('처리 중');
      expect(assigneeSelect()).toHaveDisplayValue('opb@moa.test');
      expect(isAriaDisabled(statusSaveButton())).toBe(true);
      expect(updateAdminInquiryMeta).not.toHaveBeenCalled();
    });

    it('실패 alert 를 지우고 서버 값으로 되돌린다', async () => {
      const { client } = await loadPage();
      vi.mocked(updateAdminInquiryMeta).mockRejectedValue(new Error('boom'));
      choose(statusSelect(), '답변 대기');
      fireEvent.click(statusSaveButton());
      await screen.findByRole('alert');
      await waitForIdle(client);

      fireEvent.click(statusCancelButton());

      expect(alerts()).toHaveLength(0);
      expect(statusSelect()).toHaveDisplayValue('처리 중');
      expect(updateAdminInquiryMeta).toHaveBeenCalledTimes(1);
    });
  });

  describe('종결된 문의', () => {
    beforeEach(() => {
      server = createServer({
        messages: [QUESTION],
        inquiry: { status: 'closed', closeReason: '테스트' },
      });
      installServer(server);
    });

    it('선택, 저장, 취소가 모두 aria-disabled 이고 눌러도 요청하지 않는다', async () => {
      await loadPage();

      expect(isAriaDisabled(statusSelect())).toBe(true);
      expect(isAriaDisabled(assigneeSelect())).toBe(true);
      expect(isAriaDisabled(statusSaveButton())).toBe(true);
      expect(isAriaDisabled(statusCancelButton())).toBe(true);
      fireEvent.click(statusSaveButton());
      await flush();
      expect(updateAdminInquiryMeta).not.toHaveBeenCalled();
    });

    it('기존 이유 안내가 선택에 연결돼 있다', async () => {
      await loadPage();

      expect(describedText(statusSelect())).toContain(
        '종결된 문의는 카테고리, 상태, 담당자를 바꿀 수 없어요',
      );
      expect(describedText(assigneeSelect())).toContain(
        '종결된 문의는 카테고리, 상태, 담당자를 바꿀 수 없어요',
      );
    });
  });
});

describe('사이드 패널 - 기기 정보', () => {
  it('앱 버전 / OS / 기기 / 언어 를 dl 로 보인다', async () => {
    await loadPage();

    expect(definitionOf('앱 버전')).toBe('1.2.3');
    expect(definitionOf('OS')).toBe('iOS 17.4');
    expect(definitionOf('기기')).toBe('iPhone 15');
    expect(definitionOf('언어')).toBe('ko-KR');
  });

  it('보내지 않았으면 "기기 정보를 보내지 않았어요" 만 보인다', async () => {
    server = createServer({ inquiry: { deviceInfo: null } });
    installServer(server);
    await loadPage();

    expect(screen.getByText('기기 정보를 보내지 않았어요')).toBeInTheDocument();
    expect(screen.queryByText('앱 버전')).not.toBeInTheDocument();
  });

  it('오류 코드·진입 화면·마지막 동기화가 있으면(CS-06 진입) 함께 보인다', async () => {
    server = createServer({
      inquiry: {
        deviceInfo: {
          appVersion: '1.2.3',
          os: 'iOS 17.4',
          device: 'iPhone 15',
          language: 'ko-KR',
          errorCode: 'E-102',
          entryScreen: '/stats',
          lastSyncedAt: '2026-09-30T23:40:00Z',
        },
      },
    });
    installServer(server);
    await loadPage();

    expect(definitionOf('오류 코드')).toBe('E-102');
    expect(definitionOf('진입 화면')).toBe('/stats');
    expect(definitionOf('마지막 동기화')).toBe('10.01 08:40');
  });

  it('없는 선택 항목은 보이지 않는다', async () => {
    await loadPage();

    expect(screen.queryByText('오류 코드')).not.toBeInTheDocument();
    expect(screen.queryByText('진입 화면')).not.toBeInTheDocument();
    expect(screen.queryByText('마지막 동기화')).not.toBeInTheDocument();
  });
});

describe('사이드 패널 - 이전 문의', () => {
  const RECENT = [
    {
      id: 'r1',
      title: '결제 문의',
      status: 'closed' as const,
      category: 'bug_report',
      createdAt: '2026-08-13T15:00:00Z',
    },
    {
      id: 'r2',
      title: '사용 방법',
      status: 'waiting' as const,
      category: null,
      createdAt: '2026-06-01T15:00:00Z',
    },
    {
      id: 'r3',
      title: '진행 중',
      status: 'in_progress' as const,
      category: 'other',
      createdAt: '2026-05-01T15:00:00Z',
    },
  ];

  it('"이전 문의" 제목 아래 "{카테고리 또는 접수됨} · {상태} · {MM.DD}" 행을 보인다', async () => {
    server = createServer({ recent: RECENT });
    installServer(server);
    await loadPage();

    expect(
      screen.getByRole('heading', { name: '이전 문의' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/오류 신고 · 종결 · 08\.14/)).toBeVisible();
    expect(screen.getByText(/접수됨 · 답변 대기 · 06\.02/)).toBeVisible();
    expect(screen.getByText(/기타 · 처리 중 · 05\.02/)).toBeVisible();
  });

  it('각 행은 /admin/inquiries/{id}?peek=1 새 탭 링크이고 이름에 "새 탭" 이 들어간다', async () => {
    server = createServer({ recent: RECENT });
    installServer(server);
    await loadPage();

    const link = await screen.findByRole('link', {
      name: /오류 신고 · 종결 · 08\.14.*새 탭/,
    });

    // 이전 문의는 미리보기로 열어 담당자가 자동 지정되지 않게 한다.
    expect(link).toHaveAttribute('href', '/admin/inquiries/r1?peek=1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('최대 5건만 보인다', async () => {
    server = createServer({
      recent: Array.from({ length: 6 }, (_, index) => ({
        id: `r${index}`,
        title: `문의 ${index}`,
        status: 'closed' as const,
        category: 'other',
        createdAt: '2026-08-13T15:00:00Z',
      })),
    });
    installServer(server);
    await loadPage();

    await screen.findAllByRole('link', { name: /새 탭/ });
    expect(screen.getAllByRole('link', { name: /새 탭/ })).toHaveLength(5);
  });

  it('없으면 "이전 문의가 없어요"', async () => {
    await loadPage();

    expect(await screen.findByText('이전 문의가 없어요')).toBeInTheDocument();
  });

  it('조회가 실패해도 화면의 나머지는 계속 쓸 수 있다', async () => {
    vi.mocked(getAdminUserRecentInquiries).mockRejectedValue(new Error('x'));
    const view = renderPage();
    await waitForPage();
    await waitForIdle(view.client);

    expect(screen.getByLabelText('답변 내용')).toBeInTheDocument();
    expect(statusSelect()).toBeInTheDocument();
  });
});
