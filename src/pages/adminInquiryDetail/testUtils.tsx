// 어드민 문의 상세 페이지 테스트 전용 픽스처/헬퍼 (구현 코드가 아니다).
// 이 파일은 vi.mock 을 선언하지 않는다. 각 테스트 파일이 아래 모듈을 mock 해야 한다.
//  - next/navigation(useRouter, usePathname), next/link, '@/shared/api'(createBrowserClient),
//    '@/shared/lib'(useSafeBack)
//  - '@/entities/admin' 의 API 함수 전부, '@/entities/inquiry' 의 getAttachmentUrls /
//    uploadInquiryAttachment / deleteInquiryAttachments
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { StrictMode } from 'react';
import { expect, vi } from 'vitest';

import {
  addAdminMemo,
  closeAdminInquiry,
  getAdminInquiries,
  getAdminInquiry,
  getAdminInquiryMessages,
  getAdminList,
  getAdminPendingCount,
  getAdminUserRecentInquiries,
  openAdminInquiry,
  replyAdminInquiry,
  updateAdminInquiryMeta,
} from '@/entities/admin';
import { getCachedUser } from '@/entities/auth';
import { getAttachmentUrls } from '@/entities/inquiry';

import { AdminInquiryDetailPage } from './index';

export const SUPABASE = { __supabase: true };
export const INQUIRY_ID = 'inq-1';
export const OWNER_ID = 'user-1';
export const TITLE = '동기화 후 내역이 사라졌어요';
// KST 2026-10-01 14:12 (waitingSince 09:12 로부터 5시간)
export const NOW = Date.parse('2026-10-01T05:12:00Z');

export const PERMISSION_TEXT =
  '권한이 없거나 로그인이 만료됐어요. 다시 로그인해주세요.';
export const NETWORK_TEXT = '연결을 확인하고 다시 시도해주세요.';
export const GENERIC_SUBMIT_FAILURE_TEXT =
  '등록하지 못했어요. 다시 시도해주세요.';

export type Status = 'waiting' | 'in_progress' | 'answered' | 'closed';
export type Kind = 'question' | 'reply' | 'memo';

export const OPERATORS = [
  { userId: 'op-1', email: 'opa@moa.test' },
  { userId: 'op-2', email: 'opb@moa.test' },
];

export const DEVICE_INFO = {
  appVersion: '1.2.3',
  os: 'iOS 17.4',
  device: 'iPhone 15',
  language: 'ko-KR',
};

export type TestInquiry = {
  id: string;
  userId: string;
  title: string;
  status: Status;
  category: string | null;
  categoryConfidence: number | null;
  deviceInfo: Record<string, string> | null;
  assigneeId: string | null;
  assigneeEmail: string | null;
  hasUnreadReply: boolean;
  rating: number | null;
  closeReason: string | null;
  waitingSince: string;
  createdAt: string;
  updatedAt: string;
};

export const makeInquiry = (
  overrides: Partial<TestInquiry> = {},
): TestInquiry => ({
  id: INQUIRY_ID,
  userId: OWNER_ID,
  title: TITLE,
  status: 'in_progress',
  category: 'account_login',
  categoryConfidence: 0.88,
  deviceInfo: DEVICE_INFO,
  assigneeId: 'op-2',
  assigneeEmail: 'opb@moa.test',
  hasUnreadReply: false,
  rating: null,
  closeReason: null,
  waitingSince: '2026-10-01T00:12:00Z',
  createdAt: '2026-10-01T00:12:00Z',
  updatedAt: '2026-10-01T04:00:00Z',
  ...overrides,
});

export type TestMessage = {
  id: string;
  inquiryId: string;
  kind: Kind;
  authorId: string;
  authorEmail: string | null;
  body: string;
  attachments: string[];
  createdAt: string;
};

export const makeMessage = (
  id: string,
  kind: Kind,
  body: string,
  createdAt: string,
  overrides: Partial<TestMessage> = {},
): TestMessage => ({
  id,
  inquiryId: INQUIRY_ID,
  kind,
  authorId: kind === 'question' ? OWNER_ID : 'op-2',
  authorEmail: kind === 'question' ? 'user@moa.test' : 'opb@moa.test',
  body,
  attachments: [],
  createdAt,
  ...overrides,
});

// KST: 09:12 / 14:20 / 15:00 / 10:00
export const QUESTION = makeMessage(
  'm1',
  'question',
  '휴대폰을 바꾼 뒤 내역이 안 보여요.',
  '2026-10-01T00:12:00Z',
);
export const REPLY = makeMessage(
  'm2',
  'reply',
  '설정에서 동기화를 눌러주세요.',
  '2026-10-01T05:20:00Z',
);
export const FOLLOW_UP = makeMessage(
  'm3',
  'question',
  '그래도 안 돼서 다시 문의드려요.',
  '2026-10-01T06:00:00Z',
);
export const MEMO = makeMessage(
  'm4',
  'memo',
  '서버 로그 확인 요청',
  '2026-10-01T01:00:00Z',
);

export type TestRecent = {
  id: string;
  title: string;
  status: Status;
  category: string | null;
  createdAt: string;
};

export type Server = {
  inquiry: TestInquiry;
  messages: TestMessage[];
  operators: typeof OPERATORS;
  recent: TestRecent[];
};

export const createServer = (
  overrides: Partial<{
    inquiry: Partial<TestInquiry>;
    messages: TestMessage[];
    recent: TestRecent[];
  }> = {},
): Server => ({
  inquiry: makeInquiry(overrides.inquiry),
  messages: overrides.messages ?? [QUESTION],
  operators: OPERATORS,
  recent: overrides.recent ?? [],
});

const bumpUpdatedAt = (server: Server) => {
  server.inquiry.updatedAt = new Date(
    Date.parse(server.inquiry.updatedAt) + 10 * 60 * 1000,
  ).toISOString();
};

/**
 * 현실적인 서버 흉내: 조회는 현재 상태의 복사본을, 변경은 상태를 바꾸고 updatedAt 을 올린다.
 * 개별 테스트는 mockRejectedValueOnce 등으로 특정 호출만 덮어쓴다.
 */
export const installServer = (server: Server) => {
  let nextId = 100;

  vi.mocked(getAdminInquiry).mockImplementation((async () => ({
    ...server.inquiry,
  })) as never);
  vi.mocked(getAdminInquiryMessages).mockImplementation((async () =>
    server.messages.map((message) => ({ ...message }))) as never);
  vi.mocked(getAdminList).mockImplementation(
    (async () => server.operators) as never,
  );
  vi.mocked(getAdminUserRecentInquiries).mockImplementation(
    (async () => server.recent) as never,
  );
  vi.mocked(getAdminInquiries).mockResolvedValue({ items: [], total: 0 });
  vi.mocked(getAdminPendingCount).mockResolvedValue(0);

  vi.mocked(openAdminInquiry).mockImplementation((async () => {
    if (server.inquiry.status === 'waiting') {
      server.inquiry.status = 'in_progress';
      server.inquiry.assigneeId = 'op-me';
      server.inquiry.assigneeEmail = 'me@moa.test';
      bumpUpdatedAt(server);
    }
  }) as never);

  vi.mocked(replyAdminInquiry).mockImplementation((async (
    _supabase: unknown,
    payload: { body: string; attachments: string[] },
  ) => {
    const id = `m${nextId++}`;

    server.messages.push(
      makeMessage(id, 'reply', payload.body, '2026-10-01T05:40:00Z', {
        authorId: 'op-me',
        authorEmail: 'me@moa.test',
        attachments: payload.attachments,
      }),
    );
    server.inquiry.status = 'answered';
    bumpUpdatedAt(server);

    return id;
  }) as never);

  vi.mocked(addAdminMemo).mockImplementation((async (
    _supabase: unknown,
    payload: { body: string },
  ) => {
    const id = `m${nextId++}`;

    server.messages.push(
      makeMessage(id, 'memo', payload.body, '2026-10-01T05:41:00Z', {
        authorId: 'op-me',
        authorEmail: 'me@moa.test',
      }),
    );

    return id;
  }) as never);

  vi.mocked(updateAdminInquiryMeta).mockImplementation((async (
    _supabase: unknown,
    payload: { status?: Status; assigneeId?: string; category?: string },
  ) => {
    if (payload.status) server.inquiry.status = payload.status;
    if (payload.category) server.inquiry.category = payload.category;
    if (payload.assigneeId) {
      server.inquiry.assigneeId = payload.assigneeId;
      server.inquiry.assigneeEmail =
        server.operators.find((o) => o.userId === payload.assigneeId)?.email ??
        null;
    }
    bumpUpdatedAt(server);
  }) as never);

  vi.mocked(closeAdminInquiry).mockImplementation((async (
    _supabase: unknown,
    payload: { reason: string },
  ) => {
    server.inquiry.status = 'closed';
    server.inquiry.closeReason = payload.reason;
    bumpUpdatedAt(server);
  }) as never);

  vi.mocked(getAttachmentUrls).mockImplementation((async (
    _supabase: unknown,
    paths: string[],
  ) =>
    paths.map((path) => ({
      path,
      url: `https://signed.test/${path}`,
    }))) as never);
};

export const deferred = <T = void,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

export const createClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

export const renderPage = ({
  strict = false,
  inquiryId = INQUIRY_ID,
  peek,
  client = createClient(),
}: {
  strict?: boolean;
  inquiryId?: string;
  /** 생략하면 prop 을 넘기지 않는다. */
  peek?: boolean;
  /** 캐시를 미리 채운 QueryClient 를 쓰고 싶을 때. */
  client?: QueryClient;
} = {}) => {
  const page = (
    <QueryClientProvider client={client}>
      {peek === undefined ? (
        <AdminInquiryDetailPage inquiryId={inquiryId} />
      ) : (
        <AdminInquiryDetailPage inquiryId={inquiryId} peek={peek} />
      )}
    </QueryClientProvider>
  );
  const result = render(strict ? <StrictMode>{page}</StrictMode> : page);

  return { ...result, client };
};

export const waitForPage = (title = TITLE) =>
  screen.findByRole('heading', { level: 1, name: title });

export const waitForIdle = (
  client: {
    isFetching: () => number;
    isMutating: () => number;
  },
  timeout?: number,
) =>
  waitFor(
    () => {
      expect(client.isFetching()).toBe(0);
      expect(client.isMutating()).toBe(0);
    },
    timeout === undefined ? undefined : { timeout },
  );

export const flush = () => act(async () => {});

/** 페이지의 단 하나뿐인 role="status". 둘 이상이면 getByRole 이 던지므로 개수 검증도 겸한다. */
export const statusRegion = () => screen.getByRole('status');
export const statusText = () => statusRegion().textContent?.trim() ?? '';
export const waitForStatus = (text: string) =>
  waitFor(() => expect(statusText()).toBe(text));

export const isAriaDisabled = (element: HTMLElement) =>
  element.getAttribute('aria-disabled') === 'true';

/** aria-describedby 가 가리키는 요소들의 텍스트. */
export const describedText = (element: HTMLElement) =>
  (element.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ')
    .trim();

/** 상태 라벨 텍스트를 가진, <option> 이 아닌 요소(헤더 메타의 상태 뱃지 등). */
export const visibleLabels = (text: string) =>
  screen.queryAllByText(text).filter((element) => element.tagName !== 'OPTION');

export const choose = (select: HTMLElement, label: string) => {
  const option = within(select).getByRole('option', {
    name: label,
  }) as HTMLOptionElement;

  fireEvent.change(select, { target: { value: option.value } });
};

export const makeFile = (name: string, size = 1024, type = 'image/png') => {
  const file = new File(['x'], name, { type });

  Object.defineProperty(file, 'size', { value: size });

  return file;
};

export const attach = (container: HTMLElement, files: File[]) =>
  fireEvent.change(
    container.querySelector('input[type="file"]') as HTMLInputElement,
    { target: { files } },
  );

// ---- 작성 영역 ----
export const replyBox = () => screen.getByLabelText('답변 내용');
export const memoBox = () => screen.getByLabelText('메모 내용');
export const replyButton = () =>
  screen.getByRole('button', { name: '답변 등록' });
export const memoButton = () =>
  screen.getByRole('button', { name: '메모 저장' });
export const tab = (name: '답변' | '내부 메모') =>
  screen.getByRole('tab', { name });
// 버튼 이름은 시각적으로 숨긴 "첨부 사진 N / M장" 접두 라벨 뒤에 "사진 추가" 가 붙는다.
export const ADD_PHOTO_NAME = /사진 추가$/;
export const addPhotoButton = () =>
  screen.getByRole('button', { name: ADD_PHOTO_NAME });
export const deletePhotoButton = (fileName: string) =>
  screen.getByRole('button', { name: `${fileName} 사진 삭제` });

export const typeReply = (value: string) =>
  fireEvent.change(replyBox(), { target: { value } });
export const typeMemo = (value: string) =>
  fireEvent.change(memoBox(), { target: { value } });

export const previewDialog = () =>
  screen.getByRole('alertdialog', { name: '답변을 등록할까요?' });
export const queryPreviewDialog = () =>
  screen.queryByRole('alertdialog', { name: '답변을 등록할까요?' });

/** 답변을 입력하고 미리보기 대화상자까지 연다. */
export const openPreview = (body: string) => {
  typeReply(body);
  replyButton().focus();
  fireEvent.click(replyButton());

  return previewDialog();
};

export const confirmReply = () =>
  fireEvent.click(
    within(previewDialog()).getByRole('button', { name: '등록' }),
  );

/** 미리보기를 열고 등록까지 누른다. */
export const submitReply = (body: string) => {
  openPreview(body);
  confirmReply();
};

// ---- 사이드 패널 ----
export const categoryChangeButton = () =>
  screen.getByRole('button', { name: '변경' });
export const categorySelect = () => screen.getByLabelText('카테고리 변경');
export const statusSelect = () => screen.getByLabelText('상태');
export const assigneeSelect = () => screen.getByLabelText('담당자');
export const categoryRegion = () =>
  screen.getByRole('region', { name: '카테고리 · Jev 분류' });

const buttonsNamed = (name: string) =>
  screen
    .getAllByRole('button', { name })
    .filter((button) => !button.closest('[role="alertdialog"]'));

/** 카테고리 편집의 저장/취소. 상태·담당자 저장 단계의 같은 이름 버튼과 구분한다. */
export const categorySaveButton = () =>
  within(categoryRegion()).getByRole('button', { name: '저장' });
export const categoryCancelButton = () =>
  within(categoryRegion()).getByRole('button', { name: '취소' });

/** 상태·담당자 저장 단계의 저장/취소. 카테고리 영역 밖에 있는 단 하나의 버튼이다. */
export const statusSaveButton = () => {
  const found = buttonsNamed('저장').filter(
    (button) => !categoryRegion().contains(button),
  );

  expect(found).toHaveLength(1);

  return found[0];
};
export const statusCancelButton = () => {
  const found = buttonsNamed('취소').filter(
    (button) => !categoryRegion().contains(button),
  );

  expect(found).toHaveLength(1);

  return found[0];
};

/** 헤더(제목을 감싼 <header>). 메타 줄·칩은 여기서만 찾는다. */
export const header = () =>
  screen.getByRole('heading', { level: 1 }).closest('header') as HTMLElement;

export const closeButton = () =>
  screen.getByRole('button', { name: '종결 처리' });
export const closeDialog = () =>
  screen.getByRole('alertdialog', { name: '문의를 종결할까요?' });
export const queryCloseDialog = () =>
  screen.queryByRole('alertdialog', { name: '문의를 종결할까요?' });

export const definitionOf = (term: string) => {
  const dt = screen.getByText(term, { selector: 'dt' });
  const dd = dt.nextElementSibling;

  return dd?.textContent?.trim() ?? null;
};

export const photoName = (number: number, owner = '사용자 문의') =>
  `${owner} 첨부 사진 ${number} 크게 보기`;

export const fireBeforeUnload = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event;
};

/** supabase-js 가 fetch 실패를 보고하는 실제 모양. code 가 빈 문자열이라는 점이 핵심이다. */
export const NETWORK_SHAPE = {
  message: 'TypeError: Failed to fetch',
  details: '',
  hint: '',
  code: '',
};

export const REFETCH_HINT = '최신 내용을 불러오는 중이에요';

/** jsdom 에는 scrollIntoView 가 없다. 호출을 기록하는 스텁을 설치한다(vi.resetAllMocks 뒤에 호출). */
export const installScrollSpy = () => {
  const spy = vi.fn();

  Element.prototype.scrollIntoView = spy;

  return spy;
};

/** scrollIntoView 가 호출된 요소들. */
export const scrolledElements = () =>
  vi
    .mocked(Element.prototype.scrollIntoView)
    .mock.contexts.map((context) => context as Element);

/** 요소(또는 그 카드/자손)로 스크롤했는지. 카드를 감싼 <li> 도 같은 대상으로 본다. */
export const wasScrolledTo = (element: Element) =>
  scrolledElements().some(
    (target) =>
      target === element ||
      element.contains(target) ||
      element.closest('li') === target,
  );

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 현재 로그인한 운영자(나). installServer 의 열기 흉내가 담당자로 지정하는 id 와 같다. */
export const CURRENT_USER_ID = 'op-me';

/**
 * getCachedUser 가 돌려줄 현재 사용자를 정한다.
 * 이 헬퍼를 쓰는 테스트 파일은 vi.mock('@/entities/auth') 로 getCachedUser 를 vi.fn() 으로 바꿔 둬야 하고,
 * vi.resetAllMocks 뒤에 호출해야 한다.
 */
export const installCurrentUser = (id: string | null = CURRENT_USER_ID) => {
  vi.mocked(getCachedUser).mockResolvedValue(
    (id === null ? null : { id }) as never,
  );
};

/** 서버 흉내의 문의를 다른 운영자가 바꾼 것처럼 고친다(updatedAt 도 올린다). */
export const changeServerInquiry = (
  server: Server,
  change: Partial<TestInquiry>,
) => {
  Object.assign(server.inquiry, change);
  bumpUpdatedAt(server);
};
