import type { ReactNode } from 'react';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { closeAdminInquiry } from '@/entities/admin';
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
  choose,
  closeButton,
  closeDialog,
  createServer,
  deferred,
  describedText,
  installServer,
  isAriaDisabled,
  queryCloseDialog,
  renderPage,
  statusSelect,
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
  server = createServer({ messages: [QUESTION, REPLY] });
  installServer(server);
});

afterEach(() => {
  vi.useRealTimers();
});

const CLOSE_FAILURE_TEXT = '종결하지 못했어요. 다시 시도해주세요.';
const INVALID_STATE_TEXT = '이미 종결된 문의예요.';

const dialogReason = () =>
  within(closeDialog()).getByLabelText('종결 사유 (필수)') as HTMLSelectElement;
const dialogConfirm = () =>
  within(closeDialog()).getByRole('button', { name: '종결하기' });
const dialogCancel = () =>
  within(closeDialog()).getByRole('button', { name: '취소' });
const customInput = () =>
  within(closeDialog()).getByLabelText('직접 입력 (필수)');

const openClose = async () => {
  const view = await loadPage();

  closeButton().focus();
  fireEvent.click(closeButton());

  return view;
};

describe('종결 처리 - 대화상자', () => {
  it('"종결 처리" 를 누르면 alertdialog "문의를 종결할까요?" 가 열리고 기본 포커스는 안전한 "취소" 다', async () => {
    await openClose();

    expect(closeDialog()).toBeInTheDocument();
    expect(dialogCancel()).toHaveFocus();
    expect(closeAdminInquiry).not.toHaveBeenCalled();
  });

  it('"종결 사유" 선택에 중복 문의 / 스팸·광고 / 테스트 / 기타 가 있다', async () => {
    await openClose();

    ['중복 문의', '스팸·광고', '테스트', '기타'].forEach((label) =>
      expect(
        within(dialogReason()).getByRole('option', { name: label }),
      ).toBeInTheDocument(),
    );
  });

  it('사유를 고르기 전에는 "종결하기" 가 aria-disabled 이고 눌러도 호출하지 않는다', async () => {
    await openClose();

    expect(isAriaDisabled(dialogConfirm())).toBe(true);
    expect(dialogConfirm()).not.toBeDisabled();
    fireEvent.click(dialogConfirm());

    expect(closeAdminInquiry).not.toHaveBeenCalled();
    expect(closeDialog()).toBeInTheDocument();
  });

  it.each(['중복 문의', '스팸·광고', '테스트'])(
    '%s 를 고르면 그 라벨을 사유로 종결한다 (직접 입력 칸은 없다)',
    async (label) => {
      await openClose();

      choose(dialogReason(), label);

      expect(isAriaDisabled(dialogConfirm())).toBe(false);
      expect(
        within(closeDialog()).queryByLabelText('직접 입력 (필수)'),
      ).not.toBeInTheDocument();
      fireEvent.click(dialogConfirm());

      await waitFor(() =>
        expect(closeAdminInquiry).toHaveBeenCalledWith(SUPABASE, {
          inquiryId: INQUIRY_ID,
          reason: label,
        }),
      );
      expect(closeAdminInquiry).toHaveBeenCalledTimes(1);
    },
  );

  describe('기타', () => {
    const chooseOther = async () => {
      const view = await openClose();

      choose(dialogReason(), '기타');

      return view;
    };

    it('"직접 입력" 칸이 나타나고 비어 있거나 공백뿐이면 aria-disabled 다', async () => {
      await chooseOther();

      expect(customInput()).toBeInTheDocument();
      expect(isAriaDisabled(dialogConfirm())).toBe(true);

      fireEvent.change(customInput(), { target: { value: '   ' } });
      expect(isAriaDisabled(dialogConfirm())).toBe(true);
      fireEvent.click(dialogConfirm());
      expect(closeAdminInquiry).not.toHaveBeenCalled();
    });

    it('입력한 글을 사유로 종결한다', async () => {
      await chooseOther();

      fireEvent.change(customInput(), {
        target: { value: '고객 요청으로 종결' },
      });
      expect(isAriaDisabled(dialogConfirm())).toBe(false);
      fireEvent.click(dialogConfirm());

      await waitFor(() =>
        expect(closeAdminInquiry).toHaveBeenCalledWith(SUPABASE, {
          inquiryId: INQUIRY_ID,
          reason: '고객 요청으로 종결',
        }),
      );
    });

    it('500자까지 허용하고 501자는 aria-disabled 다', async () => {
      await chooseOther();

      fireEvent.change(customInput(), { target: { value: '가'.repeat(500) } });
      expect(isAriaDisabled(dialogConfirm())).toBe(false);

      fireEvent.change(customInput(), { target: { value: '가'.repeat(501) } });
      expect(isAriaDisabled(dialogConfirm())).toBe(true);
    });

    it('기타에서 미리 정한 사유로 바꾸면 입력 글이 아니라 그 라벨을 쓴다', async () => {
      await chooseOther();
      fireEvent.change(customInput(), { target: { value: '쓰다 만 사유' } });

      choose(dialogReason(), '테스트');
      fireEvent.click(dialogConfirm());

      await waitFor(() =>
        expect(closeAdminInquiry).toHaveBeenCalledWith(SUPABASE, {
          inquiryId: INQUIRY_ID,
          reason: '테스트',
        }),
      );
    });
  });

  it('"취소" 는 아무것도 보내지 않고 닫으며 포커스를 "종결 처리" 로 돌려준다', async () => {
    await openClose();
    choose(dialogReason(), '테스트');

    fireEvent.click(dialogCancel());

    expect(queryCloseDialog()).not.toBeInTheDocument();
    expect(closeAdminInquiry).not.toHaveBeenCalled();
    expect(closeButton()).toHaveFocus();
  });

  it('Esc 로도 닫히고 포커스가 "종결 처리" 로 돌아온다', async () => {
    await openClose();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(queryCloseDialog()).not.toBeInTheDocument();
    expect(closeButton()).toHaveFocus();
  });

  it('다시 열면 이전에 고른 사유는 초기화돼 있다', async () => {
    await openClose();
    choose(dialogReason(), '테스트');
    fireEvent.click(dialogCancel());

    fireEvent.click(closeButton());

    expect(isAriaDisabled(dialogConfirm())).toBe(true);
  });
});

describe('종결 처리 - 대화상자 접근성 (필수 표시, 사유 안내)', () => {
  const REASON_HINT = '종결 사유를 선택해주세요';
  const CUSTOM_HINT = '직접 입력해주세요';

  it('사유 선택은 "종결 사유 (필수)" 라벨과 aria-required 를 가진다', async () => {
    await openClose();

    expect(dialogReason()).toHaveAttribute('aria-required', 'true');
    expect(dialogReason()).toHaveAccessibleName('종결 사유 (필수)');
  });

  it('"기타" 의 직접 입력은 "직접 입력 (필수)" 라벨과 aria-required 를 가진다', async () => {
    await openClose();
    choose(dialogReason(), '기타');

    expect(customInput()).toHaveAttribute('aria-required', 'true');
    expect(customInput()).toHaveAccessibleName('직접 입력 (필수)');
  });

  it('사용자에게 어떻게 보이는지 알리는 안내 문구가 있다', async () => {
    await openClose();

    expect(
      within(closeDialog()).getByText(
        '사용자에게는 종결된 문의로만 표시돼요. 사유는 운영자에게만 보여요.',
      ),
    ).toBeVisible();
  });

  it('사유를 고르기 전에는 "종결하기" 가 aria-disabled 이고 "종결 사유를 선택해주세요" 가 aria-describedby 로 연결된다', async () => {
    await openClose();

    expect(isAriaDisabled(dialogConfirm())).toBe(true);
    expect(describedText(dialogConfirm())).toContain(REASON_HINT);
  });

  it('"기타" 를 골랐는데 비어 있거나 공백뿐이면 "직접 입력해주세요" 로 바뀐다', async () => {
    await openClose();
    choose(dialogReason(), '기타');

    expect(isAriaDisabled(dialogConfirm())).toBe(true);
    expect(describedText(dialogConfirm())).toContain(CUSTOM_HINT);
    expect(describedText(dialogConfirm())).not.toContain(REASON_HINT);

    fireEvent.change(customInput(), { target: { value: '   ' } });

    expect(describedText(dialogConfirm())).toContain(CUSTOM_HINT);
  });

  it('유효해지면 안내는 연결에서 빠지고 "종결하기" 가 풀린다', async () => {
    await openClose();
    choose(dialogReason(), '기타');
    fireEvent.change(customInput(), { target: { value: '고객 요청' } });

    expect(isAriaDisabled(dialogConfirm())).toBe(false);
    expect(describedText(dialogConfirm())).not.toContain(CUSTOM_HINT);
    expect(describedText(dialogConfirm())).not.toContain(REASON_HINT);

    choose(dialogReason(), '테스트');

    expect(describedText(dialogConfirm())).not.toContain(REASON_HINT);
  });

  it('안내 문구는 알림 영역(role status/alert)이 아니다', async () => {
    await openClose();

    const hint = within(closeDialog()).getByText(REASON_HINT);

    expect(hint.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  describe('500자 초과', () => {
    const OVER_TEXT = '500자를 넘었어요';

    it('501자부터 "500자를 넘었어요" 가 직접 입력의 aria-describedby 안에 보이고 "종결하기" 는 aria-disabled 다', async () => {
      await openClose();
      choose(dialogReason(), '기타');

      fireEvent.change(customInput(), { target: { value: '가'.repeat(501) } });

      expect(describedText(customInput())).toContain(OVER_TEXT);
      expect(customInput()).toHaveAttribute('aria-invalid', 'true');
      expect(isAriaDisabled(dialogConfirm())).toBe(true);
      fireEvent.click(dialogConfirm());
      expect(closeAdminInquiry).not.toHaveBeenCalled();
    });

    it('정확히 500자까지는 보이지 않고 풀려 있다', async () => {
      await openClose();
      choose(dialogReason(), '기타');

      fireEvent.change(customInput(), { target: { value: '가'.repeat(500) } });

      expect(describedText(customInput())).not.toContain(OVER_TEXT);
      expect(isAriaDisabled(dialogConfirm())).toBe(false);
    });

    it('줄이면 다시 사라진다', async () => {
      await openClose();
      choose(dialogReason(), '기타');
      fireEvent.change(customInput(), { target: { value: '가'.repeat(501) } });

      fireEvent.change(customInput(), { target: { value: '가'.repeat(10) } });

      expect(describedText(customInput())).not.toContain(OVER_TEXT);
    });

    it('이 안내는 새 알림 영역을 만들지 않는다', async () => {
      await openClose();
      choose(dialogReason(), '기타');

      fireEvent.change(customInput(), { target: { value: '가'.repeat(501) } });

      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(alerts()).toHaveLength(0);
    });
  });
});

describe('종결 처리 - 제출', () => {
  it('같은 tick 에 "종결하기" 를 두 번 눌러도 한 번만 보낸다', async () => {
    await openClose();
    choose(dialogReason(), '중복 문의');
    const gate = deferred();
    vi.mocked(closeAdminInquiry).mockReturnValue(gate.promise);
    const confirm = dialogConfirm();

    await act(async () => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    gate.resolve();

    await waitFor(() => expect(closeAdminInquiry).toHaveBeenCalledTimes(1));
  });

  describe('성공', () => {
    const closeWith = async (reason = '중복 문의') => {
      const view = await openClose();

      choose(dialogReason(), reason);
      fireEvent.click(dialogConfirm());
      await waitFor(() => expect(queryCloseDialog()).not.toBeInTheDocument());
      await waitForIdle(view.client);

      return view;
    };

    it('대화상자가 닫히고 헤더가 "종결" 과 사유를 보인다', async () => {
      await closeWith('중복 문의');

      expect(visibleLabels('종결').length).toBeGreaterThan(0);
      expect(screen.getByText('종결 사유: 중복 문의')).toBeInTheDocument();
    });

    it('직접 입력한 사유가 그대로 보인다', async () => {
      const view = await openClose();
      choose(dialogReason(), '기타');
      fireEvent.change(customInput(), {
        target: { value: '고객 요청으로 종결' },
      });

      fireEvent.click(dialogConfirm());

      await waitFor(() => expect(queryCloseDialog()).not.toBeInTheDocument());
      await waitForIdle(view.client);
      expect(
        screen.getByText('종결 사유: 고객 요청으로 종결'),
      ).toBeInTheDocument();
    });

    it('작성 영역은 "종결된 문의예요." 안내로 바뀐다', async () => {
      await closeWith();

      expect(screen.getByText('종결된 문의예요.')).toBeInTheDocument();
      expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: '답변 등록' }),
      ).not.toBeInTheDocument();
    });

    it('"문의를 종결했어요" 를 한 번만 알리고 토스트는 없으며 포커스는 페이지 제목(h1)으로 간다', async () => {
      await closeWith();

      await waitForStatus('문의를 종결했어요');
      expect(statusText()).toBe('문의를 종결했어요');
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(toastMessage()).toBeNull();
      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 1 })).toHaveFocus(),
      );
    });

    it('종결 뒤에는 "종결 처리", 상태, 담당자가 모두 aria-disabled 다', async () => {
      await closeWith();

      expect(isAriaDisabled(closeButton())).toBe(true);
      expect(isAriaDisabled(statusSelect())).toBe(true);
      expect(isAriaDisabled(assigneeSelect())).toBe(true);
    });
  });

  describe('실패', () => {
    const FAILURES: [string, unknown, string][] = [
      ['네트워크', new TypeError('Failed to fetch'), NETWORK_TEXT],
      ['forbidden', { code: 'P0001', message: 'forbidden' }, PERMISSION_TEXT],
      [
        'invalid_state',
        { code: 'P0001', message: 'invalid_state' },
        INVALID_STATE_TEXT,
      ],
      ['그 밖의 오류', new Error('boom'), CLOSE_FAILURE_TEXT],
      [
        '서버 원문',
        { code: 'XX000', message: 'secret internal detail' },
        CLOSE_FAILURE_TEXT,
      ],
    ];

    it.each(FAILURES)(
      '%s: 대화상자 안에 단일 인라인 alert(고정 문구)를 보이고 대화상자는 열려 있다',
      async (_name, error, text) => {
        const { client } = await openClose();
        vi.mocked(closeAdminInquiry).mockRejectedValue(error);
        choose(dialogReason(), '중복 문의');

        fireEvent.click(dialogConfirm());

        const alert = await within(closeDialog()).findByRole('alert');
        expect(alert).toHaveTextContent(text);
        await waitForIdle(client);
        expect(alerts()).toHaveLength(1);
        expect(closeDialog()).toBeInTheDocument();
        expect(document.body).not.toHaveTextContent('secret internal detail');
        expect(statusText()).toBe('');
        expect(toastMessage()).toBeNull();
        expect(screen.queryByText(/종결 사유:/)).not.toBeInTheDocument();
        expect(document.activeElement).not.toBe(document.body);
      },
    );

    it('실패 뒤에도 다시 시도할 수 있다', async () => {
      const { client } = await openClose();
      vi.mocked(closeAdminInquiry).mockRejectedValueOnce(new Error('boom'));
      choose(dialogReason(), '중복 문의');
      fireEvent.click(dialogConfirm());
      await within(closeDialog()).findByRole('alert');
      await waitForIdle(client);

      fireEvent.click(dialogConfirm());

      await waitFor(() => expect(queryCloseDialog()).not.toBeInTheDocument());
      expect(closeAdminInquiry).toHaveBeenCalledTimes(2);
      await waitForStatus('문의를 종결했어요');
    });
  });
});

describe('종결 처리 - 이미 종결된 문의', () => {
  beforeEach(() => {
    server = createServer({
      messages: [QUESTION, REPLY],
      inquiry: { status: 'closed', closeReason: '중복 문의' },
    });
    installServer(server);
  });

  it('"종결 처리" 는 aria-disabled 이고 눌러도 대화상자가 열리지 않는다', async () => {
    await loadPage();

    expect(isAriaDisabled(closeButton())).toBe(true);
    expect(closeButton()).not.toBeDisabled();
    fireEvent.click(closeButton());

    expect(queryCloseDialog()).not.toBeInTheDocument();
    expect(closeAdminInquiry).not.toHaveBeenCalled();
  });
});
