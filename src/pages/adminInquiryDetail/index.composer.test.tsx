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
  addAdminMemo,
  getAdminInquiry,
  getAdminInquiryMessages,
  replyAdminInquiry,
} from '@/entities/admin';
import {
  deleteInquiryAttachments,
  uploadInquiryAttachment,
} from '@/entities/inquiry';
import { useToast } from '@/shared/ui';

import {
  ADD_PHOTO_NAME,
  GENERIC_SUBMIT_FAILURE_TEXT,
  INQUIRY_ID,
  NETWORK_SHAPE,
  NETWORK_TEXT,
  NOW,
  OWNER_ID,
  PERMISSION_TEXT,
  QUESTION,
  REPLY,
  SUPABASE,
  UUID_PATTERN,
  addPhotoButton,
  attach,
  categorySaveButton,
  createServer,
  deferred,
  deletePhotoButton,
  describedText,
  fireBeforeUnload,
  header,
  installScrollSpy,
  installServer,
  isAriaDisabled,
  makeFile,
  makeMessage,
  memoBox,
  memoButton,
  openPreview,
  previewDialog,
  queryPreviewDialog,
  renderPage,
  replyBox,
  replyButton,
  statusRegion,
  statusText,
  submitReply,
  tab,
  typeMemo,
  typeReply,
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

const BODY = '설정에서 동기화를 한 번 더 눌러주세요.';
const MB = 1024 * 1024;
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
const toastMessage = () => useToast.getState().message;
const before = (a: HTMLElement, b: HTMLElement) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

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

describe('작성 영역 - 탭', () => {
  it('"답변" / "내부 메모" tablist 가 있고 "답변" 이 선택돼 있다', async () => {
    await loadPage();

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(tab('답변')).toHaveAttribute('aria-selected', 'true');
    expect(tab('내부 메모')).toHaveAttribute('aria-selected', 'false');
  });

  it('roving tabindex: 선택된 탭만 tabIndex 0 이다', async () => {
    await loadPage();

    expect(tab('답변')).toHaveAttribute('tabindex', '0');
    expect(tab('내부 메모')).toHaveAttribute('tabindex', '-1');

    fireEvent.click(tab('내부 메모'));

    expect(tab('내부 메모')).toHaveAttribute('tabindex', '0');
    expect(tab('답변')).toHaveAttribute('tabindex', '-1');
  });

  it('탭 패널은 선택된 탭 이름을 가진다', async () => {
    await loadPage();

    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('답변');

    fireEvent.click(tab('내부 메모'));

    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('내부 메모');
  });

  it('탭을 누르면 입력창 라벨이 "답변 내용" / "메모 내용" 으로 바뀐다', async () => {
    await loadPage();
    expect(replyBox()).toBeInTheDocument();
    expect(screen.queryByLabelText('메모 내용')).not.toBeInTheDocument();

    fireEvent.click(tab('내부 메모'));

    expect(memoBox()).toBeInTheDocument();
    expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument();
  });

  it('방향키는 포커스를 옮기고 그 탭을 바로 선택한다 (끝에서는 반대편으로 순환)', async () => {
    await loadPage();
    tab('답변').focus();

    fireEvent.keyDown(tab('답변'), { key: 'ArrowRight' });

    expect(tab('내부 메모')).toHaveFocus();
    expect(tab('내부 메모')).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tab('내부 메모'), { key: 'ArrowRight' });

    expect(tab('답변')).toHaveFocus();
    expect(tab('답변')).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tab('답변'), { key: 'ArrowLeft' });

    expect(tab('내부 메모')).toHaveFocus();
    expect(tab('내부 메모')).toHaveAttribute('aria-selected', 'true');
  });

  it('탭을 오가도 답변 초안이 남고, 메모 입력창은 비어 시작한다', async () => {
    await loadPage();
    typeReply('쓰던 답변');

    fireEvent.click(tab('내부 메모'));
    expect(memoBox()).toHaveValue('');
    typeMemo('쓰던 메모');
    fireEvent.click(tab('답변'));

    expect(replyBox()).toHaveValue('쓰던 답변');
  });

  it('메모 탭에는 사진 첨부가 없다', async () => {
    await loadPage();
    expect(addPhotoButton()).toBeInTheDocument();

    fireEvent.click(tab('내부 메모'));

    expect(
      screen.queryByRole('button', { name: ADD_PHOTO_NAME }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '답변 등록' }),
    ).not.toBeInTheDocument();
  });
});

describe('작성 영역 - 입력과 등록 버튼 상태', () => {
  it('글자 수 카운터는 "{n} / 2,000" 이다', async () => {
    await loadPage();
    expect(screen.getByText('0 / 2,000')).toBeInTheDocument();

    typeReply('안녕하세요');

    expect(screen.getByText('5 / 2,000')).toBeInTheDocument();
  });

  it('메모 입력창에도 같은 카운터가 있다', async () => {
    await loadPage();
    fireEvent.click(tab('내부 메모'));

    typeMemo('메모예요');

    expect(screen.getByText('4 / 2,000')).toBeInTheDocument();
  });

  it.each(['', '   ', '\n\n'])(
    '답변이 %j 이면 "답변 등록" 은 aria-disabled 이고 포커스를 받으며 눌러도 미리보기가 열리지 않는다',
    async (value) => {
      await loadPage();
      typeReply(value);

      expect(isAriaDisabled(replyButton())).toBe(true);
      expect(replyButton()).not.toBeDisabled();
      replyButton().focus();
      expect(replyButton()).toHaveFocus();

      fireEvent.click(replyButton());

      expect(queryPreviewDialog()).not.toBeInTheDocument();
    },
  );

  it('내용이 있으면 활성화된다', async () => {
    await loadPage();
    typeReply(BODY);

    expect(isAriaDisabled(replyButton())).toBe(false);
  });

  it('정확히 2,000자는 등록할 수 있고 2,001자는 aria-disabled 와 초과 카운터를 보인다', async () => {
    await loadPage();

    typeReply('가'.repeat(2000));
    expect(isAriaDisabled(replyButton())).toBe(false);
    expect(screen.getByText('2,000 / 2,000')).toBeInTheDocument();

    typeReply('가'.repeat(2001));
    expect(isAriaDisabled(replyButton())).toBe(true);
    expect(screen.getByText('2,001 / 2,000')).toBeInTheDocument();
    fireEvent.click(replyButton());
    expect(queryPreviewDialog()).not.toBeInTheDocument();
  });

  describe('카테고리가 없는 문의', () => {
    beforeEach(() => {
      server = createServer({
        messages: [QUESTION],
        inquiry: { category: null, categoryConfidence: null },
      });
      installServer(server);
    });

    const BANNER = '카테고리를 먼저 지정해야 답변할 수 있어요';
    const OLD_HINT = '카테고리를 먼저 지정해주세요';
    const OLD_SIDE_NOTE = '답변 전에 카테고리를 지정해야 해요';

    it('"답변 등록" 은 aria-disabled 이고 배너 "카테고리를 먼저 지정해야 답변할 수 있어요" 가 aria-describedby 로 연결된다', async () => {
      await loadPage();
      typeReply(BODY);

      expect(isAriaDisabled(replyButton())).toBe(true);
      expect(describedText(replyButton())).toContain(BANNER);
      expect(replyButton()).toHaveAccessibleDescription(
        expect.stringContaining(BANNER),
      );
    });

    it('미분류 안내는 답변 영역의 배너 하나뿐이다 (옛 인라인 힌트와 패널 안내는 없다)', async () => {
      await loadPage();
      typeReply(BODY);

      expect(screen.getAllByText(BANNER)).toHaveLength(1);
      expect(
        screen.getAllByRole('button', { name: '지정하러 가기' }),
      ).toHaveLength(1);
      expect(screen.queryByText(OLD_HINT)).not.toBeInTheDocument();
      expect(screen.queryByText(OLD_SIDE_NOTE)).not.toBeInTheDocument();
      expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('헤더의 "미분류" 칩은 그대로 남는다', async () => {
      await loadPage();

      expect(within(header()).getByText('미분류')).toBeVisible();
    });

    it('눌러도 미리보기는 열리지 않고 포커스가 카테고리 선택으로 이동한다', async () => {
      await loadPage();
      typeReply(BODY);
      replyButton().focus();

      fireEvent.click(replyButton());

      expect(queryPreviewDialog()).not.toBeInTheDocument();
      expect(screen.getByLabelText('카테고리 변경')).toHaveFocus();
      expect(replyAdminInquiry).not.toHaveBeenCalled();
    });

    it('카테고리를 지정하면 힌트가 사라지고 등록할 수 있다', async () => {
      const view = await loadPage();
      typeReply(BODY);
      const select = screen.getByLabelText('카테고리 변경');
      fireEvent.change(select, {
        target: {
          value: (
            within(select).getByRole('option', {
              name: '오류 신고',
            }) as HTMLOptionElement
          ).value,
        },
      });
      fireEvent.click(categorySaveButton());
      await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(false));
      await waitForIdle(view.client);

      expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
      expect(describedText(replyButton())).not.toContain(BANNER);
      expect(replyButton()).not.toHaveAccessibleDescription(
        expect.stringContaining(BANNER),
      );
      expect(screen.queryByText(OLD_HINT)).not.toBeInTheDocument();
    });

    it('내부 메모는 카테고리 없이도 저장할 수 있다', async () => {
      await loadPage();
      fireEvent.click(tab('내부 메모'));
      typeMemo('메모');

      expect(isAriaDisabled(memoButton())).toBe(false);
    });
  });
});

describe('작성 영역 - 사진 첨부 (답변)', () => {
  it('파일 입력은 지원 형식을 다중 선택으로 받는다', async () => {
    const { container } = await loadPage();
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    expect(input).toHaveAttribute('multiple');
    [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ].forEach((type) => expect(input.accept).toContain(type));
  });

  it('고른 사진은 "{파일명} 사진 삭제" 버튼이 있는 썸네일로 보이고 sr-only 상태가 "사진 N장 첨부됨" 을 알린다', async () => {
    const { container } = await loadPage();

    attach(container, [
      makeFile('a.png'),
      makeFile('b.jpg', 1024, 'image/jpeg'),
    ]);

    expect(
      screen.getByRole('button', { name: 'a.png 사진 삭제' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'b.jpg 사진 삭제' }),
    ).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(statusText()).toBe('사진 2장 첨부됨');
  });

  it('삭제하면 해당 사진이 사라지고 object URL 을 해제하며 개수를 다시 알린다', async () => {
    const { container } = await loadPage();
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    fireEvent.click(deletePhotoButton('a.png'));

    expect(
      screen.queryByRole('button', { name: 'a.png 사진 삭제' }),
    ).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(statusText()).toBe('사진 1장 첨부됨');
  });

  it('3장을 넘기면 하나도 추가하지 않고 인라인 alert 로만 알린다 (토스트 없음)', async () => {
    const { container } = await loadPage();
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    attach(container, [makeFile('c.png'), makeFile('d.png')]);

    expect(screen.getByRole('alert')).toHaveTextContent(
      '사진은 최대 3장까지 올릴 수 있어요.',
    );
    expect(screen.getAllByRole('button', { name: /사진 삭제$/ })).toHaveLength(
      2,
    );
    expect(toastMessage()).toBeNull();
  });

  it('지원하지 않는 형식과 10MB 초과는 사유와 함께 막는다', async () => {
    const { container } = await loadPage();

    attach(container, [makeFile('a.gif', 1024, 'image/gif')]);
    expect(screen.getByRole('alert')).toHaveTextContent(
      '지원하지 않는 사진 형식이에요. JPG, PNG, WebP, HEIC 사진만 올릴 수 있어요.',
    );

    attach(container, [makeFile('big.png', 10 * MB + 1)]);
    expect(screen.getByRole('alert')).toHaveTextContent(
      '사진은 장당 10MB까지 올릴 수 있어요.',
    );
    expect(
      screen.queryByRole('button', { name: /사진 삭제$/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('정확히 10MB 3장은 허용하고, type 이 빈 HEIC 도 확장자로 허용한다', async () => {
    const { container } = await loadPage();

    attach(container, [
      makeFile('a.png', 10 * MB),
      makeFile('b.png', 10 * MB),
      makeFile('c.heic', 10 * MB, ''),
    ]);

    expect(screen.getAllByRole('button', { name: /사진 삭제$/ })).toHaveLength(
      3,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('3장이 차면 "사진 추가" 는 aria-disabled 이고 포커스를 받을 수 있다', async () => {
    const { container } = await loadPage();

    attach(container, [
      makeFile('a.png'),
      makeFile('b.png'),
      makeFile('c.png'),
    ]);

    expect(isAriaDisabled(addPhotoButton())).toBe(true);
    expect(addPhotoButton()).not.toBeDisabled();
  });

  describe('삭제 후 포커스', () => {
    const attachThree = async () => {
      const { container } = await loadPage();

      attach(container, [
        makeFile('a.png'),
        makeFile('b.png'),
        makeFile('c.png'),
      ]);
    };

    it('가운데를 지우면 다음 썸네일의 삭제 버튼으로 이동한다', async () => {
      await attachThree();

      fireEvent.click(deletePhotoButton('b.png'));

      expect(deletePhotoButton('c.png')).toHaveFocus();
    });

    it('마지막을 지우면 이전 썸네일의 삭제 버튼으로 이동한다', async () => {
      await attachThree();

      fireEvent.click(deletePhotoButton('c.png'));

      expect(deletePhotoButton('b.png')).toHaveFocus();
    });

    it('하나뿐인 사진을 지우면 "사진 추가" 로 이동한다', async () => {
      const { container } = await loadPage();
      attach(container, [makeFile('a.png')]);

      fireEvent.click(deletePhotoButton('a.png'));

      expect(addPhotoButton()).toHaveFocus();
    });
  });
});

describe('작성 영역 - 사진 추가 버튼 이름과 안내', () => {
  const FULL_HINT = '사진은 최대 3장까지 올릴 수 있어요';

  it('버튼 이름은 "첨부 사진 {n} / 3장" 접두 라벨로 시작하고 장수가 바뀌면 따라 바뀐다', async () => {
    const { container } = await loadPage();

    expect(addPhotoButton()).toHaveAccessibleName(
      /^첨부 사진 0 \/ 3장\s*사진 추가$/,
    );

    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    expect(addPhotoButton()).toHaveAccessibleName(
      /^첨부 사진 2 \/ 3장\s*사진 추가$/,
    );

    fireEvent.click(deletePhotoButton('a.png'));

    expect(addPhotoButton()).toHaveAccessibleName(
      /^첨부 사진 1 \/ 3장\s*사진 추가$/,
    );
  });

  it('가득 차면 aria-disabled 이고 "사진은 최대 3장까지 올릴 수 있어요" 가 aria-describedby 로 연결된다', async () => {
    const { container } = await loadPage();
    expect(describedText(addPhotoButton())).not.toContain(FULL_HINT);

    attach(container, [
      makeFile('a.png'),
      makeFile('b.png'),
      makeFile('c.png'),
    ]);

    expect(addPhotoButton()).toHaveAccessibleName(
      /^첨부 사진 3 \/ 3장\s*사진 추가$/,
    );
    expect(isAriaDisabled(addPhotoButton())).toBe(true);
    expect(addPhotoButton()).not.toBeDisabled();
    expect(describedText(addPhotoButton())).toContain(FULL_HINT);
  });

  it('가득 찬 안내는 알림 영역이 아닌 평문이다', async () => {
    const { container } = await loadPage();

    attach(container, [
      makeFile('a.png'),
      makeFile('b.png'),
      makeFile('c.png'),
    ]);

    const hint = screen.getByText(FULL_HINT);

    expect(hint.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('하나를 지워 자리가 생기면 다시 활성화되고 안내 연결도 풀린다', async () => {
    const { container } = await loadPage();
    attach(container, [
      makeFile('a.png'),
      makeFile('b.png'),
      makeFile('c.png'),
    ]);

    fireEvent.click(deletePhotoButton('a.png'));

    expect(isAriaDisabled(addPhotoButton())).toBe(false);
    expect(describedText(addPhotoButton())).not.toContain(FULL_HINT);
  });
});

describe('작성 영역 - 글자 수 초과 안내 (aria-describedby)', () => {
  const OVER_TEXT = '2,000자를 넘었어요';

  it('답변이 2,000자를 넘으면 입력창 설명에 "2,000자를 넘었어요" 가 포함된다', async () => {
    await loadPage();

    typeReply('가'.repeat(2000));
    expect(describedText(replyBox())).not.toContain(OVER_TEXT);

    typeReply('가'.repeat(2001));

    expect(describedText(replyBox())).toContain(OVER_TEXT);
    expect(describedText(replyBox())).toContain('2,001 / 2,000');
  });

  it('줄이면 다시 사라진다', async () => {
    await loadPage();
    typeReply('가'.repeat(2001));

    typeReply('가'.repeat(10));

    expect(describedText(replyBox())).not.toContain(OVER_TEXT);
  });

  it('메모 입력창도 같다', async () => {
    await loadPage();
    fireEvent.click(tab('내부 메모'));

    typeMemo('가'.repeat(2001));

    expect(describedText(memoBox())).toContain(OVER_TEXT);
  });

  it('새 알림 영역을 만들지 않는다 (role="status" 는 하나뿐, alert 없음)', async () => {
    await loadPage();

    typeReply('가'.repeat(2001));

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(statusText()).toBe('');
    expect(alerts()).toHaveLength(0);
  });
});

describe('작성 영역 - 탭 의미 안내', () => {
  it('답변 탭 패널은 "사용자 앱의 문의 내역에 표시돼요" 를 보이고 메모로 표시되지 않는다', async () => {
    await loadPage();

    const panel = screen.getByRole('tabpanel');
    const note = within(panel).getByText('사용자 앱의 문의 내역에 표시돼요');

    expect(note).toBeVisible();
    expect(note.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(panel).not.toHaveAttribute('data-kind', 'memo');
    expect(
      within(panel).queryByText('운영자끼리만 볼 수 있어요'),
    ).not.toBeInTheDocument();
  });

  it('내부 메모 탭 패널은 data-kind="memo" 이고 "운영자끼리만 볼 수 있어요" 를 보인다', async () => {
    await loadPage();

    fireEvent.click(tab('내부 메모'));

    const panel = screen.getByRole('tabpanel');
    const note = within(panel).getByText('운영자끼리만 볼 수 있어요');

    expect(panel).toHaveAttribute('data-kind', 'memo');
    expect(note).toBeVisible();
    expect(note.closest('[role="status"], [role="alert"]')).toBeNull();
    expect(
      within(panel).queryByText('사용자 앱의 문의 내역에 표시돼요'),
    ).not.toBeInTheDocument();
  });

  it('답변 탭으로 돌아오면 memo 표시가 사라진다', async () => {
    await loadPage();
    fireEvent.click(tab('내부 메모'));

    fireEvent.click(tab('답변'));

    expect(screen.getByRole('tabpanel')).not.toHaveAttribute(
      'data-kind',
      'memo',
    );
  });

  it('두 안내 모두 새 알림 영역을 만들지 않는다', async () => {
    await loadPage();
    fireEvent.click(tab('내부 메모'));

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(statusText()).toBe('');
  });
});

describe('답변 등록 - 미리보기', () => {
  it('"답변 등록" 을 누르면 본문과 첨부 장수를 담은 alertdialog "답변을 등록할까요?" 가 열리고 기본 포커스는 "계속 수정" 이다', async () => {
    const { container } = await loadPage();
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    const dialog = openPreview(BODY);

    expect(within(dialog).getByText(BODY)).toBeInTheDocument();
    expect(within(dialog).getByText('첨부 2장')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: '계속 수정' }),
    ).toHaveFocus();
    expect(
      within(dialog).getByRole('button', { name: '등록' }),
    ).toBeInTheDocument();
    expect(replyAdminInquiry).not.toHaveBeenCalled();
    expect(uploadInquiryAttachment).not.toHaveBeenCalled();
  });

  it('"계속 수정" 은 아무것도 보내지 않고 닫으며 초안을 지키고 포커스를 "답변 등록" 으로 돌려준다', async () => {
    const { container } = await loadPage();
    attach(container, [makeFile('a.png')]);
    const dialog = openPreview(BODY);

    fireEvent.click(within(dialog).getByRole('button', { name: '계속 수정' }));

    expect(queryPreviewDialog()).not.toBeInTheDocument();
    expect(replyBox()).toHaveValue(BODY);
    expect(deletePhotoButton('a.png')).toBeInTheDocument();
    expect(replyButton()).toHaveFocus();
    expect(uploadInquiryAttachment).not.toHaveBeenCalled();
    expect(replyAdminInquiry).not.toHaveBeenCalled();
  });

  it('Esc 로도 닫히고 포커스가 "답변 등록" 으로 돌아온다', async () => {
    await loadPage();
    openPreview(BODY);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(queryPreviewDialog()).not.toBeInTheDocument();
    expect(replyButton()).toHaveFocus();
  });
});

describe('답변 등록 - 제출', () => {
  it('사진을 문의 작성자 폴더로 올리고(같은 folderId) 경로와 기대값으로 답변한다 (마지막 메모는 기대 메시지에서 제외)', async () => {
    const { container } = await loadPage();
    const a = makeFile('a.png');
    const b = makeFile('b.png');
    attach(container, [a, b]);

    submitReply(BODY);

    await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(1));
    expect(uploadInquiryAttachment).toHaveBeenCalledTimes(2);
    const uploads = vi
      .mocked(uploadInquiryAttachment)
      .mock.calls.map(
        ([, req]) => req as { userId: string; folderId: string; file: File },
      );
    expect(uploads.map((req) => req.file)).toEqual([a, b]);
    uploads.forEach((req) => {
      expect(req.userId).toBe(OWNER_ID);
      expect(req.folderId).toMatch(UUID_PATTERN);
    });
    expect(uploads[0].folderId).toBe(uploads[1].folderId);
    expect(vi.mocked(uploadInquiryAttachment).mock.calls[0][0]).toEqual(
      SUPABASE,
    );
    expect(replyAdminInquiry).toHaveBeenCalledWith(SUPABASE, {
      inquiryId: INQUIRY_ID,
      body: BODY,
      attachments: [
        `${OWNER_ID}/${uploads[0].folderId}/a.png`,
        `${OWNER_ID}/${uploads[0].folderId}/b.png`,
      ],
      expectedLastMessageId: REPLY.id,
      expectedUpdatedAt: '2026-10-01T04:00:00Z',
    });
  });

  it('사진이 없으면 업로드하지 않고 빈 attachments 로 답변한다', async () => {
    await loadPage();

    submitReply(BODY);

    await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(1));
    expect(uploadInquiryAttachment).not.toHaveBeenCalled();
    expect(replyAdminInquiry).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({ attachments: [] }),
    );
  });

  it('등록 중 같은 tick 에 "등록" 을 두 번 눌러도 한 번만 보낸다', async () => {
    const { container, client } = await loadPage();
    attach(container, [makeFile('a.png')]);
    const gate = deferred<string>();
    vi.mocked(replyAdminInquiry).mockReturnValue(gate.promise);
    openPreview(BODY);
    const confirm = within(previewDialog()).getByRole('button', {
      name: '등록',
    });

    await act(async () => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    gate.resolve('new-id');
    await waitForIdle(client);

    expect(replyAdminInquiry).toHaveBeenCalledTimes(1);
    expect(uploadInquiryAttachment).toHaveBeenCalledTimes(1);
  });

  describe('성공', () => {
    it('대화상자가 닫히고 입력과 사진이 비워지며 포커스가 입력창으로 돌아온다', async () => {
      const { container, client } = await loadPage();
      attach(container, [makeFile('a.png'), makeFile('b.png')]);

      submitReply(BODY);

      await waitFor(() => expect(queryPreviewDialog()).not.toBeInTheDocument());
      await waitForIdle(client);
      expect(replyBox()).toHaveValue('');
      expect(
        screen.queryByRole('button', { name: /사진 삭제$/ }),
      ).not.toBeInTheDocument();
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
      await waitFor(() => expect(replyBox()).toHaveFocus());
      expect(tab('답변')).toHaveAttribute('aria-selected', 'true');
    });

    it('스레드에 새 답변이 나타나고 상태가 "답변 완료" 가 된다', async () => {
      const { client } = await loadPage();
      expect(visibleLabels('처리 중').length).toBeGreaterThan(0);

      submitReply(BODY);

      expect(await screen.findByText(BODY)).toBeInTheDocument();
      await waitForIdle(client);
      expect(visibleLabels('답변 완료').length).toBeGreaterThan(0);
      expect(visibleLabels('처리 중')).toHaveLength(0);
    });

    it('"답변을 등록했어요" 를 한 번만 알리고 토스트는 띄우지 않는다', async () => {
      const { client } = await loadPage();
      expect(statusText()).toBe('');

      submitReply(BODY);

      await waitForStatus('답변을 등록했어요');
      await waitForIdle(client);
      expect(statusText()).toBe('답변을 등록했어요');
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(toastMessage()).toBeNull();
      expect(alerts()).toHaveLength(0);
    });

    it('등록 뒤 다음 답변은 갱신된 기대값(방금 답변 id, 새 updatedAt)을 쓴다', async () => {
      const { client } = await loadPage();
      submitReply(BODY);
      await screen.findByText(BODY);
      await waitForIdle(client);

      submitReply('추가로 안내드려요.');

      await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(2));
      const [, second] = vi.mocked(replyAdminInquiry).mock.calls[1] as [
        unknown,
        { expectedLastMessageId: string; expectedUpdatedAt: string },
      ];
      const [, first] = vi.mocked(replyAdminInquiry).mock.calls[0] as [
        unknown,
        { expectedLastMessageId: string; expectedUpdatedAt: string },
      ];
      expect(second.expectedLastMessageId).not.toBe(
        first.expectedLastMessageId,
      );
      expect(second.expectedUpdatedAt).toBe('2026-10-01T04:10:00.000Z');
    });
  });

  describe('실패', () => {
    const COPY: [string, unknown, string][] = [
      [
        'uncategorized',
        { code: 'P0001', message: 'uncategorized' },
        '카테고리를 먼저 지정해주세요.',
      ],
      ['forbidden', { code: 'P0001', message: 'forbidden' }, PERMISSION_TEXT],
      [
        'unauthorized',
        { code: 'P0001', message: 'unauthorized' },
        PERMISSION_TEXT,
      ],
      ['네트워크', new TypeError('Failed to fetch'), NETWORK_TEXT],
      ['supabase-js 네트워크 실패 모양', NETWORK_SHAPE, NETWORK_TEXT],
      [
        'invalid_body',
        { code: 'P0001', message: 'invalid_body' },
        GENERIC_SUBMIT_FAILURE_TEXT,
      ],
      ['알 수 없는 오류', new Error('boom'), GENERIC_SUBMIT_FAILURE_TEXT],
    ];

    it.each(COPY)(
      '%s: 단 하나의 인라인 alert(고정 문구)만 보이고 초안과 사진은 남으며 대화상자는 닫힌다 (토스트 없음)',
      async (_name, error, text) => {
        const { container, client } = await loadPage();
        attach(container, [makeFile('a.png')]);
        vi.mocked(replyAdminInquiry).mockRejectedValue(error);

        submitReply(BODY);

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent(text);
        await waitForIdle(client);
        expect(alerts()).toHaveLength(1);
        expect(queryPreviewDialog()).not.toBeInTheDocument();
        expect(replyBox()).toHaveValue(BODY);
        expect(deletePhotoButton('a.png')).toBeInTheDocument();
        expect(toastMessage()).toBeNull();
        expect(isAriaDisabled(replyButton())).toBe(false);
        expect(document.activeElement).not.toBe(document.body);
        // 오류 안내는 버튼들 위에 있다.
        expect(before(alert, replyButton())).toBe(true);
      },
    );

    it('서버 오류 원문은 보이지 않는다', async () => {
      await loadPage();
      vi.mocked(replyAdminInquiry).mockRejectedValue({
        code: 'XX000',
        message: 'secret internal detail',
      });

      submitReply(BODY);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(GENERIC_SUBMIT_FAILURE_TEXT);
      expect(document.body).not.toHaveTextContent('secret internal detail');
    });

    it('실패에는 성공 안내를 하지 않는다', async () => {
      const { client } = await loadPage();
      vi.mocked(replyAdminInquiry).mockRejectedValue(new Error('boom'));

      submitReply(BODY);

      await screen.findByRole('alert');
      await waitForIdle(client);
      expect(statusText()).toBe('');
    });

    it('다음 시도를 시작하면 이전 alert 는 사라진다', async () => {
      const { client } = await loadPage();
      vi.mocked(replyAdminInquiry).mockRejectedValueOnce(new Error('boom'));
      submitReply(BODY);
      await screen.findByRole('alert');
      // 실패 뒤 다시 맞추는 조회가 끝나기 전에는 등록이 막힌다.
      await waitForIdle(client);
      const gate = deferred<string>();
      vi.mocked(replyAdminInquiry).mockReturnValue(gate.promise);

      submitReply(BODY);

      await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(2));
      expect(alerts()).toHaveLength(0);
      gate.resolve('x');
    });

    describe('올려 둔 사진 정리', () => {
      const failWith = async (error: unknown) => {
        const { container, client } = await loadPage();
        attach(container, [makeFile('a.png'), makeFile('b.png')]);
        vi.mocked(replyAdminInquiry).mockRejectedValue(error);

        submitReply(BODY);
        await screen.findByRole('alert');
        await waitForIdle(client);
      };

      it.each([
        [
          '코드가 있는 서버 거절',
          { code: 'P0001', message: 'invalid_attachments' },
        ],
        ['conflict 메시지만 있는 Error', new Error('conflict')],
        ['uncategorized 메시지만 있는 Error', new Error('uncategorized')],
        [
          'PostgREST 제약 위반 {code: 23514}',
          { code: '23514', message: 'check violation' },
        ],
        [
          'code 와 conflict 가 함께 있는 객체',
          { code: 'P0001', message: 'conflict' },
        ],
      ])('%s 는 올린 파일을 지운다', async (_name, error) => {
        await failWith(error);

        const uploaded = vi.mocked(uploadInquiryAttachment).mock.results.length;
        expect(uploaded).toBe(2);
        await waitFor(() =>
          expect(deleteInquiryAttachments).toHaveBeenCalledTimes(1),
        );
        const [supabase, paths] = vi.mocked(deleteInquiryAttachments).mock
          .calls[0] as [unknown, string[]];
        expect(supabase).toEqual(SUPABASE);
        expect(paths).toHaveLength(2);
        expect(paths[0]).toMatch(new RegExp(`^${OWNER_ID}/.+/a\\.png$`));
        expect(paths[1]).toMatch(new RegExp(`^${OWNER_ID}/.+/b\\.png$`));
      });

      it.each([
        ['네트워크 오류', new TypeError('Failed to fetch')],
        ['supabase-js 네트워크 실패 모양(빈 code)', NETWORK_SHAPE],
        ['알 수 없는 Error', new Error('boom')],
      ])(
        '%s 는 서버가 처리했을 수도 있어 지우지 않는다',
        async (_name, error) => {
          await failWith(error);

          expect(deleteInquiryAttachments).not.toHaveBeenCalled();
        },
      );

      it('supabase-js 의 실제 네트워크 실패 모양(빈 code)은 파일과 초안을 지키고 연결 안내만 보인다', async () => {
        await failWith(NETWORK_SHAPE);

        expect(deleteInquiryAttachments).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent(NETWORK_TEXT);
        expect(alerts()).toHaveLength(1);
        expect(deletePhotoButton('a.png')).toBeInTheDocument();
        expect(deletePhotoButton('b.png')).toBeInTheDocument();
        expect(replyBox()).toHaveValue(BODY);
      });

      it('정리가 실패해도 오류 안내는 그대로 하나만 보인다', async () => {
        vi.mocked(deleteInquiryAttachments).mockRejectedValue(
          new Error('storage'),
        );

        await failWith({ code: 'P0001', message: 'conflict' });

        expect(alerts()).toHaveLength(1);
      });

      it('재시도는 새 folderId 로 다시 올린다', async () => {
        await failWith(new TypeError('Failed to fetch'));
        vi.mocked(replyAdminInquiry).mockResolvedValue('new-id');

        submitReply(BODY);

        await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(2));
        const folderIds = vi
          .mocked(uploadInquiryAttachment)
          .mock.calls.map(([, req]) => (req as { folderId: string }).folderId);
        expect(folderIds).toHaveLength(4);
        expect(folderIds[0]).toBe(folderIds[1]);
        expect(folderIds[2]).toBe(folderIds[3]);
        expect(folderIds[2]).not.toBe(folderIds[0]);
      });
    });

    describe('사진 업로드 단계 실패', () => {
      it('올라간 사진을 지우고 답변은 보내지 않으며 업로드 실패 안내를 보인다', async () => {
        const { container } = await loadPage();
        attach(container, [makeFile('a.png'), makeFile('b.png')]);
        vi.mocked(uploadInquiryAttachment)
          .mockImplementationOnce(
            (async (
              _supabase: unknown,
              {
                userId,
                folderId,
                file,
              }: {
                userId: string;
                folderId: string;
                file: File;
              },
            ) => `${userId}/${folderId}/${file.name}`) as never,
          )
          .mockRejectedValueOnce(new Error('storage'));

        submitReply(BODY);

        expect(await screen.findByRole('alert')).toHaveTextContent(
          '사진 업로드에 실패했어요. 다시 시도해주세요.',
        );
        expect(replyAdminInquiry).not.toHaveBeenCalled();
        await waitFor(() =>
          expect(deleteInquiryAttachments).toHaveBeenCalledTimes(1),
        );
        expect(
          (vi.mocked(deleteInquiryAttachments).mock.calls[0][1] as string[])
            .length,
        ).toBe(1);
        expect(replyBox()).toHaveValue(BODY);
        expect(deletePhotoButton('b.png')).toBeInTheDocument();
      });
    });

    describe('conflict (다른 운영자가 먼저 답변)', () => {
      const makeConflict = (gate?: ReturnType<typeof deferred<unknown[]>>) =>
        vi.mocked(replyAdminInquiry).mockImplementationOnce((async () => {
          server.messages.push(OTHER_REPLY);
          server.inquiry.status = 'answered';
          server.inquiry.updatedAt = '2026-10-01T05:30:00Z';
          if (gate) {
            vi.mocked(getAdminInquiryMessages).mockImplementationOnce(
              (() => gate.promise) as never,
            );
          }
          throw { code: 'P0001', message: 'conflict' };
        }) as never);

      it('안내 문구와 "새로고침" 을 보이고 초안과 사진은 남긴다', async () => {
        const { container, client } = await loadPage();
        attach(container, [makeFile('a.png')]);
        makeConflict();

        submitReply(BODY);

        expect(await screen.findByRole('alert')).toHaveTextContent(
          '다른 운영자가 먼저 답변했어요. 내용을 확인해주세요.',
        );
        expect(
          screen.getByRole('button', { name: '새로고침' }),
        ).toBeInTheDocument();
        await waitForIdle(client);
        expect(replyBox()).toHaveValue(BODY);
        expect(deletePhotoButton('a.png')).toBeInTheDocument();
        expect(await screen.findByText(OTHER_REPLY.body)).toBeInTheDocument();
      });

      it('새로고침이 끝날 때까지 "답변 등록" 은 aria-disabled 이고 끝나면 풀린다', async () => {
        await loadPage();
        const gate = deferred<unknown[]>();
        makeConflict(gate);

        submitReply(BODY);

        await screen.findByRole('alert');
        expect(isAriaDisabled(replyButton())).toBe(true);
        expect(replyButton()).not.toBeDisabled();
        fireEvent.click(replyButton());
        expect(queryPreviewDialog()).not.toBeInTheDocument();

        gate.resolve(server.messages.map((message) => ({ ...message })));

        await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(false));
      });

      it('"새로고침" 은 문의와 메시지를 다시 불러오고 입력은 유지한다', async () => {
        const { container, client } = await loadPage();
        attach(container, [makeFile('a.png')]);
        makeConflict();
        submitReply(BODY);
        await screen.findByRole('alert');
        await waitForIdle(client);
        const inquiryCalls = vi.mocked(getAdminInquiry).mock.calls.length;
        const messageCalls = vi.mocked(getAdminInquiryMessages).mock.calls
          .length;

        fireEvent.click(screen.getByRole('button', { name: '새로고침' }));

        await waitFor(() => {
          expect(vi.mocked(getAdminInquiry).mock.calls.length).toBe(
            inquiryCalls + 1,
          );
          expect(vi.mocked(getAdminInquiryMessages).mock.calls.length).toBe(
            messageCalls + 1,
          );
        });
        await waitForIdle(client);
        expect(replyBox()).toHaveValue(BODY);
        expect(deletePhotoButton('a.png')).toBeInTheDocument();
        expect(document.activeElement).not.toBe(document.body);
      });

      it('새로고침 뒤 다시 등록하면 최신 기대값(다른 운영자의 답변 id, 새 updatedAt)을 쓴다', async () => {
        const { client } = await loadPage();
        makeConflict();
        submitReply(BODY);
        await screen.findByRole('alert');
        await waitForIdle(client);
        await waitFor(() => expect(isAriaDisabled(replyButton())).toBe(false));

        submitReply(BODY);

        await waitFor(() => expect(replyAdminInquiry).toHaveBeenCalledTimes(2));
        expect(replyAdminInquiry).toHaveBeenLastCalledWith(
          SUPABASE,
          expect.objectContaining({
            expectedLastMessageId: OTHER_REPLY.id,
            expectedUpdatedAt: '2026-10-01T05:30:00Z',
          }),
        );
      });
    });

    describe('invalid_state (이미 종결)', () => {
      it('작성 영역이 "종결된 문의예요." 안내로 바뀐다', async () => {
        const { client } = await loadPage();
        vi.mocked(replyAdminInquiry).mockImplementationOnce((async () => {
          server.inquiry.status = 'closed';
          server.inquiry.closeReason = '중복 문의';
          throw { code: 'P0001', message: 'invalid_state' };
        }) as never);

        submitReply(BODY);

        expect(await screen.findByText('종결된 문의예요.')).toBeInTheDocument();
        await waitForIdle(client);
        expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: '답변 등록' }),
        ).not.toBeInTheDocument();
      });
    });
  });
});

describe('내부 메모', () => {
  const openMemo = async () => {
    const view = await loadPage();

    fireEvent.click(tab('내부 메모'));

    return view;
  };

  it.each(['', '   '])(
    '메모가 %j 이면 "메모 저장" 은 aria-disabled 이고 눌러도 저장하지 않는다',
    async (value) => {
      await openMemo();
      typeMemo(value);

      expect(isAriaDisabled(memoButton())).toBe(true);
      expect(memoButton()).not.toBeDisabled();
      fireEvent.click(memoButton());

      expect(addAdminMemo).not.toHaveBeenCalled();
    },
  );

  it('2,001자는 aria-disabled 다', async () => {
    await openMemo();

    typeMemo('가'.repeat(2001));

    expect(isAriaDisabled(memoButton())).toBe(true);
    expect(screen.getByText('2,001 / 2,000')).toBeInTheDocument();
  });

  it('저장하면 미리보기 없이 addAdminMemo 를 호출하고 입력을 비운 뒤 한 번 알리고 입력창으로 포커스를 돌린다', async () => {
    const { client } = await openMemo();
    typeMemo('서버 로그 확인 요청');

    fireEvent.click(memoButton());

    await waitFor(() =>
      expect(addAdminMemo).toHaveBeenCalledWith(SUPABASE, {
        inquiryId: INQUIRY_ID,
        body: '서버 로그 확인 요청',
      }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitForStatus('메모를 저장했어요');
    await waitForIdle(client);
    expect(statusText()).toBe('메모를 저장했어요');
    expect(memoBox()).toHaveValue('');
    await waitFor(() => expect(memoBox()).toHaveFocus());
    expect(toastMessage()).toBeNull();
    expect(replyAdminInquiry).not.toHaveBeenCalled();
    expect(uploadInquiryAttachment).not.toHaveBeenCalled();
  });

  it('저장한 메모는 내부 메모 카드로 스레드에 나타나고 상태는 바뀌지 않는다', async () => {
    const { client } = await openMemo();
    typeMemo('새 메모입니다');

    fireEvent.click(memoButton());

    const card = await screen.findByRole('article', {
      name: /내부 메모 · 사용자에게 보이지 않음/,
    });
    expect(card).toHaveAttribute('data-kind', 'memo');
    await waitForIdle(client);
    expect(visibleLabels('처리 중').length).toBeGreaterThan(0);
  });

  it('같은 tick 에 두 번 눌러도 한 번만 저장한다', async () => {
    await openMemo();
    typeMemo('메모');
    const gate = deferred<string>();
    vi.mocked(addAdminMemo).mockReturnValue(gate.promise);

    await act(async () => {
      fireEvent.click(memoButton());
      fireEvent.click(memoButton());
    });
    gate.resolve('x');

    await waitFor(() => expect(addAdminMemo).toHaveBeenCalledTimes(1));
  });

  it.each([
    ['네트워크', new TypeError('Failed to fetch'), NETWORK_TEXT],
    ['forbidden', { code: 'P0001', message: 'forbidden' }, PERMISSION_TEXT],
    ['그 밖의 오류', new Error('boom'), GENERIC_SUBMIT_FAILURE_TEXT],
  ])(
    '%s 실패는 하나의 인라인 alert 로 알리고 입력을 유지하며 성공 안내와 토스트는 없다',
    async (_name, error, text) => {
      const { client } = await openMemo();
      typeMemo('남겨둘 메모');
      vi.mocked(addAdminMemo).mockRejectedValue(error);

      fireEvent.click(memoButton());

      expect(await screen.findByRole('alert')).toHaveTextContent(text);
      await waitForIdle(client);
      expect(alerts()).toHaveLength(1);
      expect(memoBox()).toHaveValue('남겨둘 메모');
      expect(statusText()).toBe('');
      expect(toastMessage()).toBeNull();
      expect(isAriaDisabled(memoButton())).toBe(false);
    },
  );
});

describe('종결된 문의의 작성 영역', () => {
  const loadClosed = async (closeReason: string | null) => {
    server = createServer({
      messages: [QUESTION, REPLY],
      inquiry: { status: 'closed', closeReason },
    });
    installServer(server);

    return loadPage();
  };

  it('작성 영역 대신 "종결된 문의예요." 와 "종결 사유: {사유}" 를 보인다', async () => {
    await loadClosed('중복 문의');

    expect(screen.getByText('종결된 문의예요.')).toBeInTheDocument();
    expect(screen.getByText('종결 사유: 중복 문의')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('답변 내용')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '답변 등록' }),
    ).not.toBeInTheDocument();
  });

  it('사용자가 종결해 사유가 없으면 사유 줄 없이 안내만 보인다', async () => {
    await loadClosed(null);

    expect(screen.getByText('종결된 문의예요.')).toBeInTheDocument();
    expect(screen.queryByText(/종결 사유/)).not.toBeInTheDocument();
  });
});

describe('이탈 가드 (beforeunload)', () => {
  it('아무것도 입력하지 않았으면 막지 않는다', async () => {
    await loadPage();

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('답변을 입력하면 막고, 지우면 다시 풀린다', async () => {
    await loadPage();

    typeReply('쓰는 중');
    expect(fireBeforeUnload().defaultPrevented).toBe(true);

    typeReply('');
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('사진만 첨부해도 막는다', async () => {
    const { container } = await loadPage();

    attach(container, [makeFile('a.png')]);

    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('메모 초안도 막는다', async () => {
    await loadPage();
    fireEvent.click(tab('내부 메모'));

    typeMemo('쓰는 중');

    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('등록에 성공해 입력이 비워지면 막지 않는다', async () => {
    const { client } = await loadPage();
    typeReply(BODY);
    expect(fireBeforeUnload().defaultPrevented).toBe(true);

    submitReply(BODY);
    await waitFor(() => expect(replyBox()).toHaveValue(''));
    await waitForIdle(client);

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it('언마운트하면 리스너가 제거된다', async () => {
    const { unmount } = await loadPage();
    typeReply('쓰는 중');

    unmount();

    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});

describe('role="status" (작성 영역)', () => {
  it('페이지에는 항상 마운트된 단 하나의 role="status" 만 있다', async () => {
    const { container } = await loadPage();

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(statusRegion()).toBeInTheDocument();

    attach(container, [makeFile('a.png')]);
    fireEvent.click(tab('내부 메모'));

    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});
