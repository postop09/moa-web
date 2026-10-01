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

import {
  addInquiryFollowUp,
  classifyInquiry,
  collectDeviceInfo,
  createInquiry,
  deleteInquiryAttachments,
  getInquiry,
  getInquiryMessages,
  updateInquiry,
  uploadInquiryAttachment,
} from '@/entities/inquiry';
import { useFaqs } from '@/features/faq';
import { useToast } from '@/shared/ui';

import { InquiryWritePage } from './index';

const SUPABASE = { __supabase: true };
// 서버가 확정적으로 거절한 오류 (PostgREST 스타일 {code, message})
const TYPE_MESSAGE =
  '지원하지 않는 사진 형식이에요. JPG, PNG, WebP, HEIC 사진만 올릴 수 있어요.';
const SERVER_REJECTION = { code: '23514', message: 'check violation' };
const DEVICE = {
  appVersion: '1.2.3',
  os: 'iOS 17.4',
  device: 'iPhone',
  language: 'ko-KR',
};

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
  getCachedUser: vi.fn(async () => ({ id: 'user-1' })),
}));

vi.mock('@/entities/inquiry', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  addInquiryFollowUp: vi.fn(),
  classifyInquiry: vi.fn(),
  collectDeviceInfo: vi.fn(),
  createInquiry: vi.fn(),
  deleteInquiryAttachments: vi.fn(),
  getInquiry: vi.fn(),
  getInquiryMessages: vi.fn(),
  updateInquiry: vi.fn(),
  uploadInquiryAttachment: vi.fn(),
}));

vi.mock('@/features/faq', () => ({ useFaqs: vi.fn() }));

const makeFaq = (id: string, category: string, question: string) => ({
  id,
  category,
  question,
  answer: `${question}의 답변입니다`,
  helpfulCount: 0,
  sortOrder: 1,
  createdAt: '2026-01-01T00:00:00Z',
});

const FAQS = [
  makeFaq('f1', 'account_login', '로그인이 안 돼요'),
  makeFaq('f2', 'account_login', '비밀번호를 잊었어요'),
  makeFaq('f3', 'account_login', '계정을 탈퇴하고 싶어요'),
  makeFaq('f4', 'account_login', '네 번째 로그인 질문'),
  makeFaq('f5', 'bug_report', '앱이 멈춰요'),
];

const ORIGINAL_INQUIRY = {
  id: 'inq-9',
  userId: 'user-1',
  title: '원래 문의 제목',
  status: 'answered',
  category: null,
  deviceInfo: null,
  hasUnreadReply: false,
  rating: null,
  waitingSince: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const TITLE = '동기화 후 내역이 사라졌어요';
const BODY = '휴대폰을 바꾼 뒤 9월 내역이 안 보여요.';

const renderPage = (props: Parameters<typeof InquiryWritePage>[0]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <InquiryWritePage {...props} />
    </QueryClientProvider>,
  );
};

const isDisabled = (el: HTMLElement) =>
  el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
const titleInput = () => screen.getByRole('textbox', { name: /^제목/ });
const bodyInput = () => screen.getByRole('textbox', { name: /^내용/ });
const typeTitle = (value: string) =>
  fireEvent.change(titleInput(), { target: { value } });
const typeBody = (value: string) =>
  fireEvent.change(bodyInput(), { target: { value } });
const fillValid = () => {
  typeTitle(TITLE);
  typeBody(BODY);
};
const submitButton = () => screen.getByRole('button', { name: '문의 등록' });
const fileInput = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;
const makeFile = (name: string, size = 1024, type = 'image/png') => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};
const attach = (container: HTMLElement, files: File[]) =>
  fireEvent.change(fileInput(container), { target: { files } });
const toastMessage = () => useToast.getState().message;
const inlineAlert = () => screen.getByRole('alert');
const toastTone = () => useToast.getState().tone;
const addPhotoButton = () => screen.getByRole('button', { name: '사진 추가' });
const deleteButtons = () =>
  screen.queryAllByRole('button', { name: /사진 삭제$/ });
const deleteButton = (name: string) =>
  screen.getByRole('button', { name: `${name} 사진 삭제` });

beforeEach(() => {
  vi.clearAllMocks();
  safeBack.useSafeBack.mockImplementation(() => safeBack.goBack);
  act(() => useToast.setState({ message: null, tone: 'default' }));
  vi.mocked(getCachedUser).mockResolvedValue({ id: 'user-1' } as never);
  vi.mocked(getInquiry).mockResolvedValue(ORIGINAL_INQUIRY as never);
  vi.mocked(getInquiryMessages).mockResolvedValue([] as never);
  vi.mocked(collectDeviceInfo).mockReturnValue(DEVICE);
  vi.mocked(classifyInquiry).mockResolvedValue({
    category: null,
    confidence: null,
  });
  vi.mocked(createInquiry).mockResolvedValue('inq-1');
  vi.mocked(addInquiryFollowUp).mockResolvedValue('msg-1');
  vi.mocked(updateInquiry).mockResolvedValue(undefined);
  vi.mocked(deleteInquiryAttachments).mockResolvedValue(undefined);
  vi.mocked(uploadInquiryAttachment).mockImplementation(
    async (_s, { userId, folderId, file }) =>
      `${userId}/${folderId}/${file.name}`,
  );
  vi.mocked(useFaqs).mockImplementation(((category?: string) => ({
    data: category ? FAQS.filter((f) => f.category === category) : FAQS,
    isLoading: false,
    isError: false,
  })) as never);
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('InquiryWritePage - 폼 (new)', () => {
  it('헤더 제목, 필드, 글자 수, 비활성 등록 버튼이 보인다', () => {
    renderPage({ mode: 'new' });

    expect(
      screen.getByRole('heading', { name: '1:1 문의하기' }),
    ).toBeInTheDocument();
    expect(titleInput()).toBeInTheDocument();
    expect(bodyInput()).toBeInTheDocument();
    expect(screen.getByText('0 / 2,000 (최소 10자)')).toBeInTheDocument();
    expect(isDisabled(submitButton())).toBe(true);
  });

  it('내용을 입력하면 글자 수가 갱신된다', () => {
    renderPage({ mode: 'new' });

    typeBody('안녕하세요');

    expect(screen.getByText('5 / 2,000 (최소 10자)')).toBeInTheDocument();
  });

  it('제목 2자 이상 + 내용 10자 이상이면 등록 버튼이 활성화된다', () => {
    renderPage({ mode: 'new' });

    fillValid();

    expect(isDisabled(submitButton())).toBe(false);
  });

  it('내용이 9자면 비활성, 10자면 활성이다 (경계값)', () => {
    renderPage({ mode: 'new' });
    typeTitle(TITLE);

    typeBody('123456789');
    expect(isDisabled(submitButton())).toBe(true);

    typeBody('1234567890');
    expect(isDisabled(submitButton())).toBe(false);
  });

  it('제목이 1자면 비활성이다', () => {
    renderPage({ mode: 'new' });
    typeBody(BODY);

    typeTitle('가');

    expect(isDisabled(submitButton())).toBe(true);
  });

  it('입력 전에는 오류 안내가 없다', () => {
    renderPage({ mode: 'new' });

    expect(
      screen.queryByText('내용을 10자 이상 적어주세요.'),
    ).not.toBeInTheDocument();
  });

  it('내용 필드에서 blur하면 10자 미만 안내가 필드 아래에 보인다', () => {
    renderPage({ mode: 'new' });

    fireEvent.blur(bodyInput());

    expect(screen.getByText('내용을 10자 이상 적어주세요.')).toBeVisible();
  });

  it('첫 입력 중(blur 전, 아직 10자에 도달한 적 없음)에는 안내가 없다', () => {
    renderPage({ mode: 'new' });

    typeBody('짧');
    typeBody('짧은 글');

    expect(
      screen.queryByText('내용을 10자 이상 적어주세요.'),
    ).not.toBeInTheDocument();
  });

  it('10자 미만으로 입력한 뒤 blur 하면 안내가 보이고, 10자가 되면 사라진다', () => {
    renderPage({ mode: 'new' });

    typeBody('짧은 글');
    fireEvent.blur(bodyInput());
    expect(screen.getByText('내용을 10자 이상 적어주세요.')).toBeVisible();

    typeBody('이제는 충분히 긴 내용입니다');
    expect(
      screen.queryByText('내용을 10자 이상 적어주세요.'),
    ).not.toBeInTheDocument();
  });

  it('10자에 한 번 도달한 뒤 다시 10자 미만으로 줄이면 blur 없이도 안내가 보인다', () => {
    renderPage({ mode: 'new' });

    typeBody('이제는 충분히 긴 내용입니다');
    expect(
      screen.queryByText('내용을 10자 이상 적어주세요.'),
    ).not.toBeInTheDocument();

    typeBody('짧은 글');

    expect(screen.getByText('내용을 10자 이상 적어주세요.')).toBeVisible();
  });

  it('제목 필드 blur 시 제목 안내가 보인다', () => {
    renderPage({ mode: 'new' });

    fireEvent.blur(titleInput());

    expect(
      screen.getByText('제목을 2자 이상 50자 이하로 적어주세요.'),
    ).toBeVisible();
  });
});

describe('InquiryWritePage - 이탈 확인 (임시저장 없음)', () => {
  it('아무것도 입력하지 않았으면 뒤로 가기가 바로 이동한다', () => {
    renderPage({ mode: 'new' });

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('제목만 입력해도 뒤로 가기 시 확인 다이얼로그가 뜬다', () => {
    renderPage({ mode: 'new' });
    typeTitle('제목');

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    const dialog = screen.getByRole('alertdialog', {
      name: '작성 중인 내용이 사라져요',
    });
    expect(
      within(dialog).getByRole('button', { name: '나가기' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: '계속 쓰기' }),
    ).toBeInTheDocument();
    expect(safeBack.goBack).not.toHaveBeenCalled();
  });

  it('사진만 첨부해도 dirty로 취급한다', () => {
    const { container } = renderPage({ mode: 'new' });
    attach(container, [makeFile('a.png')]);

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(
      screen.getByRole('alertdialog', { name: '작성 중인 내용이 사라져요' }),
    ).toBeInTheDocument();
  });

  it('"계속 쓰기"는 다이얼로그만 닫고 입력을 유지한다', () => {
    renderPage({ mode: 'new' });
    typeBody(BODY);
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    fireEvent.click(screen.getByRole('button', { name: '계속 쓰기' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(safeBack.goBack).not.toHaveBeenCalled();
    expect(bodyInput()).toHaveValue(BODY);
  });

  it('"나가기"는 화면을 떠난다', () => {
    renderPage({ mode: 'new' });
    typeBody(BODY);
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    fireEvent.click(screen.getByRole('button', { name: '나가기' }));

    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('임시저장 문구나 복원 동작이 없다', () => {
    renderPage({ mode: 'new' });
    typeBody(BODY);

    expect(
      screen.queryByText('작성 중인 내용은 임시저장돼요.'),
    ).not.toBeInTheDocument();
  });
});

describe('InquiryWritePage - Jev 추천 도움말 (new)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const settle = async (ms = 800) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it('10자 미만이면 분류하지 않고 섹션도 없다', async () => {
    renderPage({ mode: 'new' });

    typeBody('123456789');
    await settle(2000);

    expect(classifyInquiry).not.toHaveBeenCalled();
    expect(screen.queryByText(/관련 도움말/)).not.toBeInTheDocument();
  });

  it('공백을 제외해 10자 미만이면 분류하지 않는다', async () => {
    renderPage({ mode: 'new' });

    typeBody('12345      ');
    await settle(2000);

    expect(classifyInquiry).not.toHaveBeenCalled();
  });

  it('입력이 멈추기 전(800ms 미만)에는 호출하지 않는다', async () => {
    renderPage({ mode: 'new' });

    typeBody(BODY);
    await settle(700);

    expect(classifyInquiry).not.toHaveBeenCalled();
  });

  it('입력이 800ms 멈추면 본문으로 한 번 호출한다', async () => {
    renderPage({ mode: 'new' });

    typeBody(BODY);
    await settle();

    expect(classifyInquiry).toHaveBeenCalledTimes(1);
    expect(classifyInquiry).toHaveBeenCalledWith(BODY, expect.anything());
  });

  it('연속 입력은 디바운스되어 마지막 값으로 한 번만 호출한다', async () => {
    renderPage({ mode: 'new' });

    typeBody('첫 번째 입력 내용입니다 1');
    await settle(500);
    typeBody('첫 번째 입력 내용입니다 12');
    await settle(500);
    typeBody('첫 번째 입력 내용입니다 123');
    await settle();

    expect(classifyInquiry).toHaveBeenCalledTimes(1);
    expect(classifyInquiry).toHaveBeenCalledWith(
      '첫 번째 입력 내용입니다 123',
      expect.anything(),
    );
  });

  it('진행 중인 분류는 추가 입력 시 abort된다', async () => {
    vi.mocked(classifyInquiry).mockReturnValue(new Promise(() => {}));
    renderPage({ mode: 'new' });

    typeBody(BODY);
    await settle();
    const signal = vi.mocked(classifyInquiry).mock.calls[0][1] as AbortSignal;
    expect(signal.aborted).toBe(false);

    typeBody(`${BODY} 추가 입력`);

    expect(signal.aborted).toBe(true);
  });

  it('카테고리가 있으면 제목과 해당 카테고리 FAQ를 최대 3개 보여준다', async () => {
    vi.mocked(classifyInquiry).mockResolvedValue({
      category: 'account_login',
      confidence: 0.9,
    });
    renderPage({ mode: 'new' });

    typeBody(BODY);
    await settle();

    expect(screen.getByText('관련 도움말 · 계정·로그인')).toBeVisible();
    expect(
      screen.getByRole('button', { name: /로그인이 안 돼요/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /비밀번호를 잊었어요/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /계정을 탈퇴하고 싶어요/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /네 번째 로그인 질문/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /앱이 멈춰요/ }),
    ).not.toBeInTheDocument();
  });

  it('FAQ를 누르면 질문과 답변이 담긴 dialog가 열리고 닫을 수 있다', async () => {
    vi.mocked(classifyInquiry).mockResolvedValue({
      category: 'account_login',
      confidence: 0.9,
    });
    renderPage({ mode: 'new' });
    typeBody(BODY);
    await settle();

    fireEvent.click(screen.getByRole('button', { name: /로그인이 안 돼요/ }));

    const dialog = screen.getByRole('dialog', { name: '로그인이 안 돼요' });
    expect(
      within(dialog).getByText('로그인이 안 돼요의 답변입니다'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: '닫기' })[0]);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('카테고리가 null이면 섹션이 없다', async () => {
    renderPage({ mode: 'new' });

    typeBody(BODY);
    await settle();

    expect(classifyInquiry).toHaveBeenCalled();
    expect(screen.queryByText(/관련 도움말/)).not.toBeInTheDocument();
  });

  it('분류가 실패해도 섹션이 없고 작성은 계속된다', async () => {
    vi.mocked(classifyInquiry).mockRejectedValue(new Error('network'));
    renderPage({ mode: 'new' });
    typeTitle(TITLE);

    typeBody(BODY);
    await settle();

    expect(screen.queryByText(/관련 도움말/)).not.toBeInTheDocument();
    expect(isDisabled(submitButton())).toBe(false);
  });

  it('내용을 10자 미만으로 지우면 섹션이 사라진다', async () => {
    vi.mocked(classifyInquiry).mockResolvedValue({
      category: 'account_login',
      confidence: 0.9,
    });
    renderPage({ mode: 'new' });
    typeBody(BODY);
    await settle();
    expect(screen.getByText(/관련 도움말/)).toBeInTheDocument();

    typeBody('짧음');
    await settle();

    expect(screen.queryByText(/관련 도움말/)).not.toBeInTheDocument();
  });
});

describe('InquiryWritePage - 사진 첨부 (new)', () => {
  it('라벨, 안내 문구, 카운터 버튼이 보인다', () => {
    renderPage({ mode: 'new' });

    expect(screen.getByText('사진 첨부 (선택, 최대 3장)')).toBeInTheDocument();
    expect(
      screen.getByText('카드번호·계좌번호는 가리고 올려주세요'),
    ).toBeInTheDocument();
    expect(addPhotoButton()).toBeInTheDocument();
    expect(screen.getByText('0 / 3')).toBeInTheDocument();
  });

  it('파일 입력은 지원 형식(jpeg/png/webp/heic/heif) 다중 선택을 허용한다', () => {
    const { container } = renderPage({ mode: 'new' });

    const input = fileInput(container);

    expect(input.accept).toBe(
      'image/jpeg,image/png,image/webp,image/heic,image/heif',
    );
    expect(input.multiple).toBe(true);
  });

  it('추가 버튼을 누르면 파일 선택이 열린다', () => {
    const { container } = renderPage({ mode: 'new' });
    const clickSpy = vi.spyOn(fileInput(container), 'click');

    fireEvent.click(addPhotoButton());

    expect(clickSpy).toHaveBeenCalled();
  });

  it('선택한 사진이 썸네일과 삭제 버튼으로 보이고 카운터가 갱신된다', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    expect(deleteButtons()).toHaveLength(2);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('삭제 버튼을 누르면 해당 사진이 제거된다', () => {
    const { container } = renderPage({ mode: 'new' });
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    fireEvent.click(deleteButtons()[0]);

    expect(deleteButtons()).toHaveLength(1);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('3장 초과 선택은 토스트로 막고 하나도 추가하지 않는다', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [
      makeFile('a.png'),
      makeFile('b.png'),
      makeFile('c.png'),
      makeFile('d.png'),
    ]);

    expect(toastMessage()).toBe('사진은 최대 3장까지 올릴 수 있어요.');
    expect(
      screen.queryByRole('button', { name: /사진 삭제$/ }),
    ).not.toBeInTheDocument();
  });

  it('이미 2장 있을 때 2장을 더 고르면 막고 기존 2장만 유지한다', () => {
    const { container } = renderPage({ mode: 'new' });
    attach(container, [makeFile('a.png'), makeFile('b.png')]);
    act(() => useToast.setState({ message: null }));

    attach(container, [makeFile('c.png'), makeFile('d.png')]);

    expect(toastMessage()).toBe('사진은 최대 3장까지 올릴 수 있어요.');
    expect(deleteButtons()).toHaveLength(2);
  });

  it('10MB를 넘는 파일은 막는다', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [makeFile('big.png', 10 * 1024 * 1024 + 1)]);

    expect(toastMessage()).toBe('사진은 장당 10MB까지 올릴 수 있어요.');
    expect(
      screen.queryByRole('button', { name: /사진 삭제$/ }),
    ).not.toBeInTheDocument();
  });

  it('정확히 10MB, 3장은 허용한다', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [
      makeFile('a.png', 10 * 1024 * 1024),
      makeFile('b.png'),
      makeFile('c.png'),
    ]);

    expect(toastMessage()).toBeNull();
    expect(deleteButtons()).toHaveLength(3);
  });
});

describe('InquiryWritePage - 기기 정보 (new)', () => {
  it('체크박스가 기본 체크이고 설명이 보인다', () => {
    renderPage({ mode: 'new' });

    expect(
      screen.getByRole('checkbox', { name: '앱·기기 정보 함께 보내기' }),
    ).toBeChecked();
    const checkbox = screen.getByRole('checkbox', {
      name: '앱·기기 정보 함께 보내기',
    });
    expect(checkbox).toHaveAccessibleDescription(
      /앱 버전, OS, 기기 모델, 언어만 보내요\. 가계부 내역·금액은 보내지 않아요\./,
    );
    expect(checkbox).toHaveAccessibleDescription(/운영자만 볼 수 있어요\./);
  });

  it('"항목 보기"를 누르면 수집 항목과 값이 보이고 다시 누르면 접힌다', () => {
    renderPage({ mode: 'new' });
    expect(screen.queryByText(/iOS 17\.4/)).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: '항목 보기' });
    fireEvent.click(toggle);

    expect(screen.getByText(/1\.2\.3/)).toBeVisible();
    expect(screen.getByText(/iOS 17\.4/)).toBeVisible();
    expect(screen.getByText(/iPhone/)).toBeVisible();
    expect(screen.getByText(/ko-KR/)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /항목/ }));
    expect(screen.queryByText(/iOS 17\.4/)).not.toBeInTheDocument();
  });
});

describe('InquiryWritePage - 등록 흐름 (new)', () => {
  it('업로드 -> 분류 -> 생성 순으로 호출하고 접수 완료 화면으로 replace한다', async () => {
    vi.mocked(classifyInquiry).mockResolvedValue({
      category: 'account_login',
      confidence: 0.87,
    });
    const { container } = renderPage({ mode: 'new' });
    fillValid();
    const a = makeFile('a.png');
    const b = makeFile('b.png');
    attach(container, [a, b]);

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/support/inquiries/inq-1/done',
      ),
    );
    expect(uploadInquiryAttachment).toHaveBeenCalledTimes(2);
    expect(uploadInquiryAttachment).toHaveBeenCalledWith(SUPABASE, {
      userId: 'user-1',
      folderId: expect.any(String),
      file: a,
    });
    const folderIds = vi
      .mocked(uploadInquiryAttachment)
      .mock.calls.map(([, req]) => req.folderId);
    expect(new Set(folderIds).size).toBe(1);
    expect(vi.mocked(classifyInquiry).mock.lastCall?.[0]).toBe(
      `${TITLE}\n${BODY}`,
    );
    expect(createInquiry).toHaveBeenCalledTimes(1);
    expect(createInquiry).toHaveBeenCalledWith(SUPABASE, {
      title: TITLE,
      body: BODY,
      category: 'account_login',
      confidence: 0.87,
      deviceInfo: DEVICE,
      attachments: [
        `user-1/${folderIds[0]}/a.png`,
        `user-1/${folderIds[0]}/b.png`,
      ],
    });
  });

  it('사진이 없으면 업로드하지 않고 빈 attachments로 생성한다', async () => {
    renderPage({ mode: 'new' });
    fillValid();

    fireEvent.click(submitButton());

    await waitFor(() => expect(createInquiry).toHaveBeenCalled());
    expect(uploadInquiryAttachment).not.toHaveBeenCalled();
    expect(vi.mocked(createInquiry).mock.calls[0][1].attachments).toEqual([]);
  });

  it('기기 정보 체크를 해제하면 deviceInfo를 null로 보낸다', async () => {
    renderPage({ mode: 'new' });
    fillValid();
    fireEvent.click(
      screen.getByRole('checkbox', { name: '앱·기기 정보 함께 보내기' }),
    );

    fireEvent.click(submitButton());

    await waitFor(() => expect(createInquiry).toHaveBeenCalled());
    expect(vi.mocked(createInquiry).mock.calls[0][1].deviceInfo).toBeNull();
  });

  it('분류 결과가 null이어도 category/confidence null로 접수한다', async () => {
    renderPage({ mode: 'new' });
    fillValid();

    fireEvent.click(submitButton());

    await waitFor(() => expect(createInquiry).toHaveBeenCalled());
    expect(createInquiry).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({ category: null, confidence: null }),
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalled());
  });

  it('분류 호출이 예외로 실패해도 category null로 접수한다', async () => {
    vi.mocked(classifyInquiry).mockRejectedValue(new Error('boom'));
    renderPage({ mode: 'new' });
    fillValid();

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(createInquiry).toHaveBeenCalledWith(
        SUPABASE,
        expect.objectContaining({ category: null, confidence: null }),
      ),
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/support/inquiries/inq-1/done',
      ),
    );
  });

  it('등록 중에는 버튼이 비활성화되고 "등록하는 중…"을 보이며 중복 클릭해도 한 번만 생성한다', async () => {
    let resolveCreate!: (id: string) => void;
    vi.mocked(createInquiry).mockReturnValue(
      new Promise<string>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    renderPage({ mode: 'new' });
    fillValid();

    fireEvent.click(submitButton());
    const pending = await screen.findByRole('button', {
      name: '등록하는 중…',
    });
    expect(isDisabled(pending)).toBe(true);
    fireEvent.click(pending);
    await waitFor(() => expect(createInquiry).toHaveBeenCalledTimes(1));

    await act(async () => resolveCreate('inq-1'));

    expect(createInquiry).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));
  });

  it('서버가 확정 거절하면 입력을 유지하고 인라인 알림만 띄우며(토스트 없음) 업로드한 파일을 정리하고 버튼을 되살린다', async () => {
    vi.mocked(createInquiry).mockRejectedValue(SERVER_REJECTION);
    const { container } = renderPage({ mode: 'new' });
    fillValid();
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(inlineAlert()).toHaveTextContent(
        '등록하지 못했어요. 다시 시도해주세요.',
      ),
    );
    expect(toastMessage()).toBeNull();
    const uploaded = vi
      .mocked(uploadInquiryAttachment)
      .mock.results.map((r) => r.value);
    const paths = await Promise.all(uploaded);
    expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, paths);
    expect(router.replace).not.toHaveBeenCalled();
    expect(titleInput()).toHaveValue(TITLE);
    expect(bodyInput()).toHaveValue(BODY);
    await waitFor(() => expect(isDisabled(submitButton())).toBe(false));
  });

  it('업로드 실패 시 업로드 실패 인라인 알림만 띄우고(토스트 없음) 문의를 만들지 않는다', async () => {
    vi.mocked(uploadInquiryAttachment).mockRejectedValue(new Error('storage'));
    const { container } = renderPage({ mode: 'new' });
    fillValid();
    attach(container, [makeFile('a.png')]);

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(inlineAlert()).toHaveTextContent(
        '사진 업로드에 실패했어요. 다시 시도해주세요.',
      ),
    );
    expect(toastMessage()).toBeNull();
    expect(createInquiry).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    expect(bodyInput()).toHaveValue(BODY);
    await waitFor(() => expect(isDisabled(submitButton())).toBe(false));
  });

  it('일부만 업로드된 뒤 실패하면 이미 올라간 파일을 정리한다', async () => {
    vi.mocked(uploadInquiryAttachment)
      .mockImplementationOnce(async (_s, { userId, folderId, file }) => {
        return `${userId}/${folderId}/${file.name}`;
      })
      .mockRejectedValueOnce(new Error('storage'));
    const { container } = renderPage({ mode: 'new' });
    fillValid();
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    fireEvent.click(submitButton());

    await waitFor(() => expect(deleteInquiryAttachments).toHaveBeenCalled());
    expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, [
      expect.stringMatching(/^user-1\/.+\/a\.png$/),
    ]);
    expect(createInquiry).not.toHaveBeenCalled();
  });
});

describe('InquiryWritePage - 추가 문의 (followUp)', () => {
  it('제목 필드가 없고 내용만 있다', () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });

    expect(
      screen.queryByRole('textbox', { name: /^제목/ }),
    ).not.toBeInTheDocument();
    expect(bodyInput()).toBeInTheDocument();
  });

  it('내용 10자 이상이면 활성화된다', () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    expect(isDisabled(submitButton())).toBe(true);

    typeBody('123456789');
    expect(isDisabled(submitButton())).toBe(true);

    typeBody('1234567890');
    expect(isDisabled(submitButton())).toBe(false);
  });

  it('등록하면 addInquiryFollowUp 후 상세로 replace한다 (분류·생성 없음)', async () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/support/inquiries/inq-9'),
    );
    expect(addInquiryFollowUp).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({ inquiryId: 'inq-9', body: BODY }),
    );
    expect(createInquiry).not.toHaveBeenCalled();
    expect(classifyInquiry).not.toHaveBeenCalled();
  });

  it('추천 도움말을 위한 분류를 하지 않는다', async () => {
    vi.useFakeTimers();
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });

    typeBody(BODY);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(classifyInquiry).not.toHaveBeenCalled();
    expect(screen.queryByText(/관련 도움말/)).not.toBeInTheDocument();
  });

  it('등록 실패 시 인라인 알림만 띄우고(토스트 없음) 이동하지 않는다', async () => {
    vi.mocked(addInquiryFollowUp).mockRejectedValue(new Error('rpc'));
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(inlineAlert()).toHaveTextContent(
        '등록하지 못했어요. 다시 시도해주세요.',
      ),
    );
    expect(toastMessage()).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
    expect(bodyInput()).toHaveValue(BODY);
  });
});

describe('InquiryWritePage - 수정 (edit)', () => {
  const INQUIRY = {
    id: 'inq-1',
    userId: 'user-1',
    title: '기존 제목입니다',
    status: 'waiting',
    category: null,
    deviceInfo: null,
    hasUnreadReply: false,
    rating: null,
    waitingSince: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  const MESSAGES = [
    {
      id: 'm1',
      inquiryId: 'inq-1',
      kind: 'question',
      body: '기존 내용입니다 열 글자 이상',
      attachments: [],
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'm2',
      inquiryId: 'inq-1',
      kind: 'question',
      body: '두 번째 질문은 무시',
      attachments: [],
      createdAt: '2026-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.mocked(getInquiry).mockResolvedValue(INQUIRY as never);
    vi.mocked(getInquiryMessages).mockResolvedValue(MESSAGES as never);
  });

  it('불러오는 동안 aria-busy 로딩 상태를 보인다', () => {
    vi.mocked(getInquiry).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage({ mode: 'edit', inquiryId: 'inq-1' });

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('제목과 첫 question 메시지 본문을 미리 채운다', async () => {
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });

    await waitFor(() => expect(titleInput()).toHaveValue('기존 제목입니다'));
    expect(bodyInput()).toHaveValue('기존 내용입니다 열 글자 이상');
    expect(getInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-1');
    expect(getInquiryMessages).toHaveBeenCalledWith(SUPABASE, 'inq-1');
  });

  it('사진 첨부 영역과 추천 도움말이 없다', async () => {
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });
    await screen.findByDisplayValue('기존 제목입니다');

    expect(
      screen.queryByText('사진 첨부 (선택, 최대 3장)'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/관련 도움말/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('앱·기기 정보 함께 보내기'),
    ).not.toBeInTheDocument();
  });

  it('수정 후 등록하면 updateInquiry를 호출하고 상세로 replace한다', async () => {
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });
    await screen.findByDisplayValue('기존 제목입니다');
    typeTitle('수정된 제목');

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/support/inquiries/inq-1'),
    );
    expect(updateInquiry).toHaveBeenCalledWith(SUPABASE, {
      inquiryId: 'inq-1',
      title: '수정된 제목',
      body: '기존 내용입니다 열 글자 이상',
    });
    expect(createInquiry).not.toHaveBeenCalled();
  });

  it('문의가 없으면 목록으로 replace하고 "삭제된 문의예요." 토스트를 띄운다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(null);
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/support/inquiries'),
    );
    expect(toastMessage()).toBe('삭제된 문의예요.');
  });
});

describe('InquiryWritePage - 필드 접근성', () => {
  it('제목·내용 라벨에 (필수)가 있고 aria-required 다', () => {
    renderPage({ mode: 'new' });

    expect(titleInput()).toHaveAccessibleName(/제목.*\(필수\)/);
    expect(titleInput()).toHaveAttribute('aria-required', 'true');
    expect(bodyInput()).toHaveAccessibleName(/내용.*\(필수\)/);
    expect(bodyInput()).toHaveAttribute('aria-required', 'true');
  });

  it('followUp 에서는 내용만 필수이고 제목 필드가 없다', () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });

    expect(
      screen.queryByRole('textbox', { name: /^제목/ }),
    ).not.toBeInTheDocument();
    expect(bodyInput()).toHaveAttribute('aria-required', 'true');
  });

  it('오류 문구에는 aria-live 가 없고 aria-invalid/aria-describedby 로 연결된다', () => {
    renderPage({ mode: 'new' });

    fireEvent.blur(bodyInput());
    fireEvent.blur(titleInput());

    const bodyMessage = screen.getByText('내용을 10자 이상 적어주세요.');
    const titleMessage = screen.getByText(
      '제목을 2자 이상 50자 이하로 적어주세요.',
    );
    [bodyMessage, titleMessage].forEach((message) => {
      expect(message).not.toHaveAttribute('aria-live');
      expect(message.closest('[aria-live]')).toBeNull();
    });
    expect(bodyInput()).toHaveAttribute('aria-invalid', 'true');
    expect(bodyInput()).toHaveAccessibleDescription(/10자 이상 적어주세요/);
    expect(titleInput()).toHaveAttribute('aria-invalid', 'true');
    expect(titleInput()).toHaveAccessibleDescription(/2자 이상 50자 이하/);
  });

  it('제목 글자 수 카운터는 "{n} / 50" 이다', () => {
    renderPage({ mode: 'new' });
    expect(screen.getByText('0 / 50')).toBeInTheDocument();

    typeTitle('가나다');

    expect(screen.getByText('3 / 50')).toBeInTheDocument();
  });

  it('제목은 maxLength 50, 내용은 maxLength 를 두지 않는다', () => {
    renderPage({ mode: 'new' });

    expect(titleInput()).toHaveAttribute('maxlength', '50');
    expect(bodyInput()).not.toHaveAttribute('maxlength');
  });

  it('내용이 2,000자를 넘으면 글자 수와 오류 문구로 알려준다', () => {
    renderPage({ mode: 'new' });

    typeBody('가'.repeat(2001));

    expect(screen.getByText('2,001 / 2,000 (최소 10자)')).toBeInTheDocument();
    expect(screen.getByText('내용은 2000자 이하로 적어주세요.')).toBeVisible();
  });
});

describe('InquiryWritePage - 개인정보 안내', () => {
  const NOTICE = '입력한 내용은 문의 분류를 위해 외부 AI 서비스로 전송돼요.';

  it('new 에서는 내용 필드 아래에 안내가 있고 내용 필드 설명에 연결된다', () => {
    renderPage({ mode: 'new' });

    expect(screen.getByText(NOTICE)).toBeInTheDocument();
    expect(bodyInput()).toHaveAccessibleDescription(
      /입력한 내용은 문의 분류를 위해 외부 AI 서비스로 전송돼요\./,
    );
    expect(bodyInput()).toHaveAccessibleDescription(/\/ 2,000/);
  });

  it('followUp 에서는 보이지 않고 내용 필드 설명에도 포함되지 않는다', () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });

    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    expect(bodyInput()).not.toHaveAccessibleDescription(/외부 AI/);
    expect(bodyInput()).toHaveAccessibleDescription(/\/ 2,000/);
  });

  it('edit 에서는 보이지 않는다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(EDIT_INQUIRY as never);
    vi.mocked(getInquiryMessages).mockResolvedValue(EDIT_MESSAGES as never);
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });
    await screen.findByDisplayValue('기존 제목입니다');

    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    expect(bodyInput()).not.toHaveAccessibleDescription(/외부 AI/);
  });
});

describe('InquiryWritePage - 추천 도움말 접근성 (new)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(classifyInquiry).mockResolvedValue({
      category: 'account_login',
      confidence: 0.9,
    });
  });

  const settle = async (ms = 800) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it('목록이 없으면 추천 개수 안내도 없다', async () => {
    vi.mocked(classifyInquiry).mockResolvedValue({
      category: null,
      confidence: null,
    });
    renderPage({ mode: 'new' });

    typeBody(BODY);
    await settle();

    expect(screen.queryByText(/추천 도움말 \d+개가 있어요/)).toBeNull();
  });

  it('목록이 나타나면 role=status 로 개수를 안내하고 래퍼에는 aria-live 가 없다', async () => {
    renderPage({ mode: 'new' });

    typeBody(BODY);
    await settle();

    const announcement = screen.getByText('추천 도움말 3개가 있어요');
    expect(announcement.closest('[role="status"]')).not.toBeNull();
    const region = screen.getByRole('region', {
      name: '관련 도움말 · 계정·로그인',
    });
    expect(region.closest('[aria-live]')).toBeNull();
    expect(region.querySelector('[aria-live]')).toBeNull();
  });

  it('목록이 바뀌면 바뀐 개수로 다시 안내한다', async () => {
    renderPage({ mode: 'new' });
    typeBody(BODY);
    await settle();
    expect(screen.getByText('추천 도움말 3개가 있어요')).toBeInTheDocument();

    vi.mocked(classifyInquiry).mockResolvedValue({
      category: 'bug_report',
      confidence: 0.9,
    });
    typeBody(`${BODY} 앱이 멈춰요`);
    await settle();

    expect(screen.getByText('추천 도움말 1개가 있어요')).toBeInTheDocument();
  });

  it('목록이 사라지면 안내 문구도 사라진다', async () => {
    renderPage({ mode: 'new' });
    typeBody(BODY);
    await settle();

    typeBody('짧음');
    await settle();

    expect(screen.queryByText(/추천 도움말 \d+개가 있어요/)).toBeNull();
  });

  it('제목은 "관련 도움말 · {카테고리}" 이고 목록 아래에 안내 문구가 있다', async () => {
    renderPage({ mode: 'new' });

    typeBody(BODY);
    await settle();

    const region = screen.getByRole('region', {
      name: '관련 도움말 · 계정·로그인',
    });
    expect(
      within(region).getByText(
        '찾는 답변이 없나요? 그대로 문의를 등록해주세요.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Jev가 찾은/)).not.toBeInTheDocument();
  });
});

describe('InquiryWritePage - 기기 정보 안내 (new)', () => {
  it('설명에 네 항목과 운영자 열람 안내가 모두 있다', () => {
    renderPage({ mode: 'new' });

    expect(
      screen.getByRole('checkbox', { name: '앱·기기 정보 함께 보내기' }),
    ).toHaveAccessibleDescription(
      /앱 버전, OS, 기기 모델, 언어만 보내요\. 가계부 내역·금액은 보내지 않아요\..*운영자만 볼 수 있어요\./,
    );
  });
});

describe('InquiryWritePage - 사진 첨부 접근성', () => {
  const photoStatus = () =>
    within(screen.getByRole('region', { name: /사진 첨부/ })).getByRole(
      'status',
    );

  it('추가 버튼 이름은 "사진 추가" 이고 개수는 별도 텍스트로 aria-describedby 에 연결된다', () => {
    renderPage({ mode: 'new' });

    expect(addPhotoButton()).toHaveAccessibleName('사진 추가');
    expect(screen.getByText('0 / 3')).toBeInTheDocument();
    expect(addPhotoButton()).toHaveAccessibleDescription(/0 \/ 3/);
  });

  it('3장이 있으면 추가 버튼이 비활성화된다', () => {
    const { container } = renderPage({ mode: 'new' });
    expect(isDisabled(addPhotoButton())).toBe(false);

    attach(container, [
      makeFile('a.png'),
      makeFile('b.png'),
      makeFile('c.png'),
    ]);

    expect(isDisabled(addPhotoButton())).toBe(true);
  });

  it('삭제 버튼 이름은 "{파일명} 사진 삭제" 다', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [makeFile('a.png'), makeFile('내사진.jpg')]);

    expect(deleteButton('a.png')).toBeInTheDocument();
    expect(deleteButton('내사진.jpg')).toBeInTheDocument();
  });

  it.each(['image/jpeg', 'image/webp', 'image/heic', 'image/heif'])(
    '%s 형식은 추가된다',
    (type) => {
      const { container } = renderPage({ mode: 'new' });

      attach(container, [makeFile('a.img', 1024, type)]);

      expect(toastMessage()).toBeNull();
      expect(deleteButtons()).toHaveLength(1);
    },
  );

  it('지원하지 않는 형식은 사유 토스트로 막는다', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [makeFile('a.gif', 1024, 'image/gif')]);

    expect(toastMessage()).toBe(TYPE_MESSAGE);
    expect(toastTone()).toBe('error');
    expect(deleteButtons()).toHaveLength(0);
  });

  it('유효한 파일과 잘못된 파일을 함께 고르면 모두 추가하지 않는다 (all-or-nothing)', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [
      makeFile('ok.png'),
      makeFile('bad.pdf', 1024, 'application/pdf'),
    ]);

    expect(toastMessage()).toBe(TYPE_MESSAGE);
    expect(deleteButtons()).toHaveLength(0);
  });

  it('개수·형식·크기가 모두 틀리면 개수 사유가 우선이다', () => {
    const { container } = renderPage({ mode: 'new' });
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    attach(container, [
      makeFile('c.gif', 10 * 1024 * 1024 + 1, 'image/gif'),
      makeFile('d.png'),
    ]);

    expect(toastMessage()).toBe('사진은 최대 3장까지 올릴 수 있어요.');
  });

  it('형식과 크기가 모두 틀리면 형식 사유가 우선이다', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [makeFile('a.gif', 10 * 1024 * 1024 + 1, 'image/gif')]);

    expect(toastMessage()).toBe(TYPE_MESSAGE);
  });

  describe('삭제 후 포커스', () => {
    const attachThree = () => {
      const view = renderPage({ mode: 'new' });
      attach(view.container, [
        makeFile('a.png'),
        makeFile('b.png'),
        makeFile('c.png'),
      ]);
    };

    it('가운데 사진을 지우면 다음 썸네일의 삭제 버튼으로 이동한다', () => {
      attachThree();

      fireEvent.click(deleteButton('b.png'));

      expect(deleteButton('c.png')).toHaveFocus();
    });

    it('첫 사진을 지워도 다음 썸네일의 삭제 버튼으로 이동한다', () => {
      attachThree();

      fireEvent.click(deleteButton('a.png'));

      expect(deleteButton('b.png')).toHaveFocus();
    });

    it('마지막 사진을 지우면 이전 썸네일의 삭제 버튼으로 이동한다', () => {
      attachThree();

      fireEvent.click(deleteButton('c.png'));

      expect(deleteButton('b.png')).toHaveFocus();
    });

    it('하나뿐인 사진을 지우면 사진 추가 버튼으로 이동한다', () => {
      const { container } = renderPage({ mode: 'new' });
      attach(container, [makeFile('a.png')]);

      fireEvent.click(deleteButton('a.png'));

      expect(addPhotoButton()).toHaveFocus();
    });
  });

  describe('첨부 상태 안내', () => {
    it('항상 마운트된 role=status 가 있다', () => {
      renderPage({ mode: 'new' });

      expect(photoStatus()).toBeInTheDocument();
    });

    it('첨부/삭제 때마다 개수를 안내하고, 모두 지우면 삭제 안내를 한다', () => {
      const { container } = renderPage({ mode: 'new' });
      const status = photoStatus();

      attach(container, [makeFile('a.png'), makeFile('b.png')]);
      expect(status).toHaveTextContent('사진 2장 첨부됨');

      fireEvent.click(deleteButton('a.png'));
      expect(status).toHaveTextContent('사진 1장 첨부됨');

      fireEvent.click(deleteButton('b.png'));
      expect(status).toHaveTextContent('사진을 모두 삭제했어요');
    });
  });
});

describe('InquiryWritePage - 이탈/제출 가드', () => {
  const fireBeforeUnload = () => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    return event;
  };

  describe('beforeunload', () => {
    it('깨끗한 폼에서는 막지 않는다', () => {
      renderPage({ mode: 'new' });

      expect(fireBeforeUnload().defaultPrevented).toBe(false);
    });

    it('내용을 입력하면(dirty) 이탈을 막는다', () => {
      renderPage({ mode: 'new' });
      typeBody('안녕');

      expect(fireBeforeUnload().defaultPrevented).toBe(true);
    });

    it('입력을 지워 다시 깨끗해지면 막지 않는다', () => {
      renderPage({ mode: 'new' });
      typeBody('안녕');
      typeBody('');

      expect(fireBeforeUnload().defaultPrevented).toBe(false);
    });

    it('언마운트하면 리스너가 제거된다', () => {
      const { unmount } = renderPage({ mode: 'new' });
      typeBody('안녕');
      unmount();

      expect(fireBeforeUnload().defaultPrevented).toBe(false);
    });

    it('제출 중에는 막지 않는다', async () => {
      vi.mocked(createInquiry).mockReturnValue(new Promise(() => {}));
      renderPage({ mode: 'new' });
      fillValid();

      fireEvent.click(submitButton());
      await screen.findByRole('button', { name: '등록하는 중…' });

      expect(fireBeforeUnload().defaultPrevented).toBe(false);
    });

    it('제출에 성공한 뒤에는 막지 않는다', async () => {
      renderPage({ mode: 'new' });
      fillValid();

      fireEvent.click(submitButton());
      await waitFor(() => expect(router.replace).toHaveBeenCalled());

      expect(fireBeforeUnload().defaultPrevented).toBe(false);
    });

    it('제출에 실패하면 다시 막는다', async () => {
      vi.mocked(createInquiry).mockRejectedValue(new Error('rpc'));
      renderPage({ mode: 'new' });
      fillValid();

      fireEvent.click(submitButton());
      await waitFor(() => expect(isDisabled(submitButton())).toBe(false));

      expect(fireBeforeUnload().defaultPrevented).toBe(true);
    });
  });

  describe('제출 중 헤더 뒤로 가기', () => {
    it('aria-disabled 이고 눌러도 이동·다이얼로그가 없다', async () => {
      vi.mocked(createInquiry).mockReturnValue(new Promise(() => {}));
      renderPage({ mode: 'new' });
      fillValid();
      fireEvent.click(submitButton());
      await screen.findByRole('button', { name: '등록하는 중…' });

      const back = screen.getByRole('button', { name: '뒤로 가기' });
      fireEvent.click(back);

      expect(back).toHaveAttribute('aria-disabled', 'true');
      expect(safeBack.goBack).not.toHaveBeenCalled();
      expect(router.back).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('제출 중이 아니면 aria-disabled 가 아니다', () => {
      renderPage({ mode: 'new' });

      expect(
        screen.getByRole('button', { name: '뒤로 가기' }),
      ).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('중복 제출 방지', () => {
    it('같은 tick 에 submit 이벤트를 두 번 보내도 한 번만 생성한다', async () => {
      vi.mocked(createInquiry).mockReturnValue(new Promise(() => {}));
      renderPage({ mode: 'new' });
      fillValid();
      const form = submitButton().closest('form') as HTMLFormElement;

      fireEvent.submit(form);
      fireEvent.submit(form);

      await waitFor(() => expect(createInquiry).toHaveBeenCalled());
      await act(async () => {});
      expect(createInquiry).toHaveBeenCalledTimes(1);
    });

    it('followUp 도 같은 tick 중복 제출을 한 번만 보낸다', async () => {
      vi.mocked(addInquiryFollowUp).mockReturnValue(new Promise(() => {}));
      renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
      typeBody(BODY);
      const form = submitButton().closest('form') as HTMLFormElement;

      fireEvent.submit(form);
      fireEvent.submit(form);

      await waitFor(() => expect(addInquiryFollowUp).toHaveBeenCalled());
      await act(async () => {});
      expect(addInquiryFollowUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('제출 중 입력 잠금', () => {
    it('텍스트 필드는 disabled 가 아니라 readOnly 가 된다', async () => {
      vi.mocked(createInquiry).mockReturnValue(new Promise(() => {}));
      renderPage({ mode: 'new' });
      fillValid();

      fireEvent.click(submitButton());
      await screen.findByRole('button', { name: '등록하는 중…' });

      [titleInput(), bodyInput()].forEach((input) => {
        expect(input).toHaveAttribute('readonly');
        expect(input).not.toBeDisabled();
      });
    });

    it('제출 중이 아니면 readOnly 가 아니다', () => {
      renderPage({ mode: 'new' });

      expect(titleInput()).not.toHaveAttribute('readonly');
      expect(bodyInput()).not.toHaveAttribute('readonly');
    });

    it('실패 후에는 다시 편집할 수 있고 포커스가 등록 버튼으로 돌아온다', async () => {
      vi.mocked(createInquiry).mockRejectedValue(new Error('rpc'));
      renderPage({ mode: 'new' });
      fillValid();

      fireEvent.click(submitButton());

      await waitFor(() => expect(submitButton()).toHaveFocus());
      expect(titleInput()).not.toHaveAttribute('readonly');
      expect(bodyInput()).not.toHaveAttribute('readonly');
    });
  });
});

describe('InquiryWritePage - 안전한 뒤로 가기 연결', () => {
  it('new: fallback 은 /support, 뒤로 가기는 useSafeBack 의 goBack 을 쓴다', () => {
    renderPage({ mode: 'new' });

    expect(safeBack.useSafeBack).toHaveBeenCalledWith('/support');
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
  });

  it('followUp: fallback 은 해당 문의 상세다', () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });

    expect(safeBack.useSafeBack).toHaveBeenCalledWith(
      '/support/inquiries/inq-9',
    );
    expect(safeBack.useSafeBack).not.toHaveBeenCalledWith('/support');
  });

  it('followUp: 이탈 확인의 "나가기"도 goBack 을 쓴다', () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    fireEvent.click(screen.getByRole('button', { name: '나가기' }));

    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
  });
});

describe('InquiryWritePage - 이탈 확인 다이얼로그 포커스', () => {
  it('"계속 쓰기"가 기본 포커스이고 "나가기"는 낮은 강조다', () => {
    renderPage({ mode: 'new' });
    typeBody(BODY);

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    const dialog = screen.getByRole('alertdialog', {
      name: '작성 중인 내용이 사라져요',
    });
    expect(
      within(dialog).getByRole('button', { name: '계속 쓰기' }),
    ).toHaveFocus();
    expect(
      within(dialog).getByRole('button', { name: '나가기' }),
    ).toHaveAttribute('data-emphasis', 'subtle');
    expect(dialog).toHaveAccessibleDescription(
      '지금 나가면 입력한 내용이 저장되지 않아요.',
    );
  });

  it('다이얼로그를 닫으면 포커스가 뒤로 가기 버튼으로 돌아온다', () => {
    renderPage({ mode: 'new' });
    typeBody(BODY);
    const back = screen.getByRole('button', { name: '뒤로 가기' });
    back.focus();
    fireEvent.click(back);
    expect(screen.getByRole('button', { name: '계속 쓰기' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: '계속 쓰기' }));

    expect(back).toHaveFocus();
  });
});

describe('InquiryWritePage - 제출 실패 메시지', () => {
  const AUTH_MESSAGE = '로그인이 만료됐어요. 다시 로그인해주세요.';
  const NETWORK_MESSAGE = '연결을 확인하고 다시 시도해주세요.';
  const UPLOAD_MESSAGE = '사진 업로드에 실패했어요. 다시 시도해주세요.';
  const DEFAULT_MESSAGE = '등록하지 못했어요. 다시 시도해주세요.';

  const expectFailure = async (message: string) => {
    await waitFor(() => expect(inlineAlert()).toHaveTextContent(message));
    expect(toastMessage()).toBeNull();
  };

  const submitNewAndFail = async (setup: () => void, withPhoto = false) => {
    setup();
    const { container } = renderPage({ mode: 'new' });
    fillValid();
    if (withPhoto) attach(container, [makeFile('a.png')]);
    fireEvent.click(submitButton());
  };

  it('성공 전에는 인라인 오류 알림이 없다', () => {
    renderPage({ mode: 'new' });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('로그인 사용자가 없으면(로그인이 필요합니다.) 만료 안내', async () => {
    await submitNewAndFail(() =>
      vi.mocked(getCachedUser).mockResolvedValue(null as never),
    );

    await expectFailure(AUTH_MESSAGE);
  });

  it("code 'unauthorized' 오류도 만료 안내", async () => {
    await submitNewAndFail(() =>
      vi
        .mocked(createInquiry)
        .mockRejectedValue(
          Object.assign(new Error('JWT expired'), { code: 'unauthorized' }),
        ),
    );

    await expectFailure(AUTH_MESSAGE);
  });

  it("Error('로그인이 필요합니다.') 도 만료 안내", async () => {
    await submitNewAndFail(() =>
      vi
        .mocked(createInquiry)
        .mockRejectedValue(new Error('로그인이 필요합니다.')),
    );

    await expectFailure(AUTH_MESSAGE);
  });

  it("TypeError('Failed to fetch') 는 연결 확인 안내", async () => {
    await submitNewAndFail(() =>
      vi
        .mocked(createInquiry)
        .mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expectFailure(NETWORK_MESSAGE);
  });

  it('사진 업로드 실패는 업로드 안내', async () => {
    await submitNewAndFail(
      () =>
        vi
          .mocked(uploadInquiryAttachment)
          .mockRejectedValue(new Error('storage')),
      true,
    );

    await expectFailure(UPLOAD_MESSAGE);
  });

  it('그 밖의 오류는 기본 안내', async () => {
    await submitNewAndFail(() =>
      vi.mocked(createInquiry).mockRejectedValue(new Error('rpc')),
    );

    await expectFailure(DEFAULT_MESSAGE);
  });

  it('followUp 의 네트워크 오류도 같은 규칙으로 안내한다', async () => {
    vi.mocked(addInquiryFollowUp).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);

    fireEvent.click(submitButton());

    await expectFailure(NETWORK_MESSAGE);
  });

  it('인라인 알림은 다음 제출 시도가 시작되면 사라진다', async () => {
    vi.mocked(createInquiry).mockRejectedValueOnce(new Error('rpc'));
    renderPage({ mode: 'new' });
    fillValid();
    fireEvent.click(submitButton());
    await expectFailure(DEFAULT_MESSAGE);

    vi.mocked(createInquiry).mockReturnValue(new Promise(() => {}));
    await waitFor(() => expect(isDisabled(submitButton())).toBe(false));
    fireEvent.click(submitButton());

    await waitFor(() => expect(createInquiry).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('InquiryWritePage - 추가 문의 (spec)', () => {
  it('원 문의 요약 줄("원 문의: {제목}")이 내용 위에 보인다', async () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });

    const summary = await screen.findByText('원 문의: 원래 문의 제목');

    expect(getInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-9');
    expect(
      summary.compareDocumentPosition(bodyInput()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('new 모드는 원 문의를 조회하지 않는다', () => {
    renderPage({ mode: 'new' });

    expect(getInquiry).not.toHaveBeenCalled();
  });

  it('제목 필드와 추천 도움말·기기 정보 영역은 없고 사진 영역은 있다', () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });

    expect(
      screen.queryByRole('textbox', { name: /^제목/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /사진 첨부/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('앱·기기 정보 함께 보내기'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('사진을 같은 folderId 로 업로드하고 경로를 attachments 로 보낸 뒤 토스트와 함께 상세로 replace 한다', async () => {
    const { container } = renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);
    const a = makeFile('a.png');
    const b = makeFile('b.png');
    attach(container, [a, b]);

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/support/inquiries/inq-9'),
    );
    expect(uploadInquiryAttachment).toHaveBeenCalledTimes(2);
    expect(uploadInquiryAttachment).toHaveBeenCalledWith(SUPABASE, {
      userId: 'user-1',
      folderId: expect.any(String),
      file: a,
    });
    const folderIds = vi
      .mocked(uploadInquiryAttachment)
      .mock.calls.map(([, req]) => req.folderId);
    expect(new Set(folderIds).size).toBe(1);
    expect(addInquiryFollowUp).toHaveBeenCalledWith(SUPABASE, {
      inquiryId: 'inq-9',
      body: BODY,
      attachments: [
        `user-1/${folderIds[0]}/a.png`,
        `user-1/${folderIds[0]}/b.png`,
      ],
    });
    expect(toastMessage()).toBe('추가 문의를 보냈어요.');
    expect(createInquiry).not.toHaveBeenCalled();
    expect(classifyInquiry).not.toHaveBeenCalled();
  });

  it('사진이 없으면 업로드 없이 빈 attachments 로 보낸다', async () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);

    fireEvent.click(submitButton());

    await waitFor(() => expect(addInquiryFollowUp).toHaveBeenCalled());
    expect(uploadInquiryAttachment).not.toHaveBeenCalled();
    expect(vi.mocked(addInquiryFollowUp).mock.calls[0][1].attachments).toEqual(
      [],
    );
  });

  it('서버가 확정 거절하면 올려둔 사진을 정리하고 이동하지 않는다', async () => {
    vi.mocked(addInquiryFollowUp).mockRejectedValue(SERVER_REJECTION);
    const { container } = renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    fireEvent.click(submitButton());

    await waitFor(() => expect(deleteInquiryAttachments).toHaveBeenCalled());
    const paths = await Promise.all(
      vi.mocked(uploadInquiryAttachment).mock.results.map((r) => r.value),
    );
    expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, paths);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('업로드가 일부 실패하면 올라간 사진을 정리하고 추가 문의를 보내지 않는다', async () => {
    vi.mocked(uploadInquiryAttachment)
      .mockImplementationOnce(
        async (_s, { userId, folderId, file }) =>
          `${userId}/${folderId}/${file.name}`,
      )
      .mockRejectedValueOnce(new Error('storage'));
    const { container } = renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);
    attach(container, [makeFile('a.png'), makeFile('b.png')]);

    fireEvent.click(submitButton());

    await waitFor(() => expect(deleteInquiryAttachments).toHaveBeenCalled());
    expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, [
      expect.stringMatching(/^user-1\/.+\/a\.png$/),
    ]);
    expect(addInquiryFollowUp).not.toHaveBeenCalled();
    expect(inlineAlert()).toHaveTextContent(
      '사진 업로드에 실패했어요. 다시 시도해주세요.',
    );
    expect(toastMessage()).toBeNull();
  });
});

const EDIT_INQUIRY = {
  id: 'inq-1',
  userId: 'user-1',
  title: '기존 제목입니다',
  status: 'waiting',
  category: null,
  deviceInfo: null,
  hasUnreadReply: false,
  rating: null,
  waitingSince: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};
const EDIT_MESSAGES = [
  {
    id: 'm1',
    inquiryId: 'inq-1',
    kind: 'question',
    body: '기존 내용입니다 열 글자 이상',
    attachments: [],
    createdAt: '2026-01-01T00:00:00Z',
  },
];
const LOCKED_MESSAGE = '답변이 시작된 문의는 수정할 수 없어요.';

describe('InquiryWritePage - 수정 (edit) 잠금/오류', () => {
  beforeEach(() => {
    vi.mocked(getInquiry).mockResolvedValue(EDIT_INQUIRY as never);
    vi.mocked(getInquiryMessages).mockResolvedValue(EDIT_MESSAGES as never);
  });

  const expectLocked = async () => {
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/support/inquiries/inq-1'),
    );
    expect(toastMessage()).toBe(LOCKED_MESSAGE);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  };

  it.each(['in_progress', 'answered', 'closed'])(
    '상태가 %s 이면 잠겨서 상세로 보내고 폼을 보이지 않는다',
    async (status) => {
      vi.mocked(getInquiry).mockResolvedValue({
        ...EDIT_INQUIRY,
        status,
      } as never);
      renderPage({ mode: 'edit', inquiryId: 'inq-1' });

      await expectLocked();
    },
  );

  it('상태가 waiting 이어도 reply 메시지가 있으면 잠근다', async () => {
    vi.mocked(getInquiryMessages).mockResolvedValue([
      ...EDIT_MESSAGES,
      {
        id: 'm2',
        inquiryId: 'inq-1',
        kind: 'reply',
        body: '답변입니다',
        attachments: [],
        createdAt: '2026-01-02T00:00:00Z',
      },
    ] as never);
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });

    await expectLocked();
  });

  it('메시지 조회가 실패하면 오류 상태와 "다시 시도"를 보이고 폼은 렌더하지 않는다', async () => {
    vi.mocked(getInquiryMessages).mockRejectedValue(new Error('network'));
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });

    expect(
      await screen.findByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '문의 등록' }),
    ).not.toBeInTheDocument();
  });

  it('"다시 시도"를 누르면 다시 조회하고 성공하면 폼이 채워진다', async () => {
    vi.mocked(getInquiryMessages).mockRejectedValueOnce(new Error('network'));
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });

    fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));

    expect(await screen.findByDisplayValue('기존 제목입니다')).toBeVisible();
    expect(getInquiryMessages).toHaveBeenCalledTimes(2);
    expect(bodyInput()).toHaveValue('기존 내용입니다 열 글자 이상');
  });

  it('첫 question 메시지가 없으면 오류 상태이고 폼은 렌더하지 않는다', async () => {
    vi.mocked(getInquiryMessages).mockResolvedValue([] as never);
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });

    expect(
      await screen.findByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('로딩 중 헤더 뒤로 가기는 상세를 fallback 으로 한 goBack 을 쓴다', () => {
    vi.mocked(getInquiry).mockReturnValue(new Promise(() => {}));
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(safeBack.useSafeBack).toHaveBeenCalledWith(
      '/support/inquiries/inq-1',
    );
    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('오류 상태의 헤더 뒤로 가기도 goBack 을 쓴다', async () => {
    vi.mocked(getInquiryMessages).mockRejectedValue(new Error('network'));
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });
    await screen.findByRole('button', { name: '다시 시도' });

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(safeBack.goBack).toHaveBeenCalledTimes(1);
  });

  it('폼이 열리면 fallback 은 상세이고 "첨부는 수정할 수 없어요." 안내가 있다', async () => {
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });
    await screen.findByDisplayValue('기존 제목입니다');

    expect(safeBack.useSafeBack).toHaveBeenCalledWith(
      '/support/inquiries/inq-1',
    );
    expect(screen.getByText('첨부는 수정할 수 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('new/followUp 에는 첨부 수정 불가 안내가 없다', () => {
    renderPage({ mode: 'new' });

    expect(
      screen.queryByText('첨부는 수정할 수 없어요.'),
    ).not.toBeInTheDocument();
  });

  it.each<[string, unknown]>([
    ['message 에 invalid_state', new Error('invalid_state: not editable')],
    [
      'code 가 invalid_state',
      Object.assign(new Error('x'), { code: 'invalid_state' }),
    ],
    [
      'Error 가 아닌 객체(message/code 에 invalid_state)',
      { message: 'invalid_state', code: 'P0001' },
    ],
  ])(
    'updateInquiry 가 %s 로 거절되면 잠금 토스트와 함께 상세로 replace 한다',
    async (_label, error) => {
      vi.mocked(updateInquiry).mockRejectedValue(error);
      renderPage({ mode: 'edit', inquiryId: 'inq-1' });
      await screen.findByDisplayValue('기존 제목입니다');
      typeTitle('수정된 제목');

      fireEvent.click(submitButton());

      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith('/support/inquiries/inq-1'),
      );
      expect(toastMessage()).toBe(LOCKED_MESSAGE);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it('invalid_state 가 아닌 수정 실패는 인라인 기본 안내만 보이고(토스트 없음) 이동하지 않는다', async () => {
    vi.mocked(updateInquiry).mockRejectedValue(new Error('rpc'));
    renderPage({ mode: 'edit', inquiryId: 'inq-1' });
    await screen.findByDisplayValue('기존 제목입니다');
    typeTitle('수정된 제목');

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(inlineAlert()).toHaveTextContent(
        '등록하지 못했어요. 다시 시도해주세요.',
      ),
    );
    expect(toastMessage()).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('InquiryWritePage - 등록 버튼 접근성 (aria-disabled)', () => {
  it('폼이 유효하지 않아도 disabled 속성이 아니라 aria-disabled="true" 이고 포커스할 수 있다', () => {
    renderPage({ mode: 'new' });

    const button = submitButton();
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('폼이 유효하면 aria-disabled 가 아니다', () => {
    renderPage({ mode: 'new' });
    fillValid();

    expect(submitButton()).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('유효하지 않을 때 누르면 createInquiry 를 호출하지 않고 모든 필드 오류를 보여준다', () => {
    renderPage({ mode: 'new' });

    fireEvent.click(submitButton());

    expect(createInquiry).not.toHaveBeenCalled();
    expect(
      screen.getByText('내용을 10자 이상 적어주세요.'),
    ).toBeInTheDocument();
    expect(titleInput()).toHaveAttribute('aria-invalid', 'true');
    expect(bodyInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('유효하지 않을 때 누르면 첫 번째 오류 필드(제목)로 포커스가 이동한다', () => {
    renderPage({ mode: 'new' });

    fireEvent.click(submitButton());

    expect(titleInput()).toHaveFocus();
  });

  it('제목은 유효하고 내용만 틀리면 내용 필드로 포커스가 이동한다', () => {
    renderPage({ mode: 'new' });
    typeTitle(TITLE);

    fireEvent.click(submitButton());

    expect(bodyInput()).toHaveFocus();
    expect(createInquiry).not.toHaveBeenCalled();
  });

  it('followUp 에서 내용이 짧으면 내용 필드로 포커스가 이동한다', () => {
    renderPage({ mode: 'followUp', inquiryId: 'inq-9' });

    fireEvent.click(submitButton());

    expect(bodyInput()).toHaveFocus();
    expect(addInquiryFollowUp).not.toHaveBeenCalled();
  });

  it('제출 중에는 disabled 가 아니라 aria-disabled + aria-busy 이고 클릭은 무시된다', async () => {
    vi.mocked(createInquiry).mockReturnValue(new Promise(() => {}));
    renderPage({ mode: 'new' });
    fillValid();

    fireEvent.click(submitButton());
    const pending = await screen.findByRole('button', {
      name: '등록하는 중…',
    });

    expect(pending).not.toBeDisabled();
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    expect(pending).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(pending);
    await act(async () => {});
    expect(createInquiry).toHaveBeenCalledTimes(1);
  });
});

describe('InquiryWritePage - 첨부 정리 정책 (확정 거절만 삭제)', () => {
  const failAndWait = async (container: HTMLElement) => {
    attach(container, [makeFile('a.png')]);
    fireEvent.click(submitButton());
    await waitFor(() => expect(inlineAlert()).toBeInTheDocument());
    await act(async () => {});
  };

  it.each<[string, unknown]>([
    ['PostgREST 객체 {code, message}', { code: '23514', message: 'x' }],
    [
      'code 문자열이 있는 Error',
      Object.assign(new Error('x'), { code: 'P0001' }),
    ],
    ['invalid_ 로 시작하는 message', new Error('invalid_title')],
    ['forbidden 메시지', new Error('forbidden')],
    ['not_found 메시지', new Error('not_found: inquiry')],
    ['unauthorized 메시지', new Error('unauthorized')],
    ['conflict 메시지', new Error('conflict')],
    ['uncategorized 메시지', new Error('uncategorized')],
    ['already_rated 메시지', new Error('already_rated')],
  ])(
    'new: createInquiry 가 %s 로 거절되면 업로드한 파일을 정리한다',
    async (_l, error) => {
      vi.mocked(createInquiry).mockRejectedValue(error);
      const { container } = renderPage({ mode: 'new' });
      fillValid();

      await failAndWait(container);

      expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, [
        expect.stringMatching(/^user-1\/.+\/a\.png$/),
      ]);
    },
  );

  it.each<[string, unknown]>([
    ["TypeError('Failed to fetch')", new TypeError('Failed to fetch')],
    ['code 없는 일반 Error', new Error('rpc')],
  ])(
    'new: createInquiry 가 %s 로 실패하면 파일을 정리하지 않고 네트워크/기본 인라인 안내를 보인다',
    async (_l, error) => {
      vi.mocked(createInquiry).mockRejectedValue(error);
      const { container } = renderPage({ mode: 'new' });
      fillValid();

      await failAndWait(container);

      expect(deleteInquiryAttachments).not.toHaveBeenCalled();
      expect(inlineAlert()).toBeInTheDocument();
    },
  );

  it('new: 네트워크 오류면 연결 확인 안내를 인라인으로 보인다', async () => {
    vi.mocked(createInquiry).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
    const { container } = renderPage({ mode: 'new' });
    fillValid();

    await failAndWait(container);

    expect(inlineAlert()).toHaveTextContent(
      '연결을 확인하고 다시 시도해주세요.',
    );
  });

  it('followUp: 네트워크 오류면 정리하지 않는다', async () => {
    vi.mocked(addInquiryFollowUp).mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    );
    const { container } = renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);

    await failAndWait(container);
    expect(deleteInquiryAttachments).not.toHaveBeenCalled();
  });

  it('followUp: PostgREST 객체로 거절되면 정리한다', async () => {
    vi.mocked(addInquiryFollowUp).mockRejectedValue(SERVER_REJECTION);
    const { container } = renderPage({ mode: 'followUp', inquiryId: 'inq-9' });
    typeBody(BODY);

    await failAndWait(container);

    expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, [
      expect.stringMatching(/^user-1\/.+\/a\.png$/),
    ]);
  });
});

describe('InquiryWritePage - HEIC/MIME 와 미리보기 실패', () => {
  it('type 이 빈 문자열이어도 .heic 확장자면 추가된다 (대소문자 무시)', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [makeFile('IMG_0001.HEIC', 1024, '')]);

    expect(toastMessage()).toBeNull();
    expect(deleteButtons()).toHaveLength(1);
  });

  it('type 이 빈 문자열이고 허용되지 않는 확장자면 형식 토스트로 막는다', () => {
    const { container } = renderPage({ mode: 'new' });

    attach(container, [makeFile('doc.pdf', 1024, '')]);

    expect(toastMessage()).toBe(TYPE_MESSAGE);
    expect(deleteButtons()).toHaveLength(0);
  });

  it('썸네일 이미지가 로드에 실패하면 안내 문구로 대체하고 파일명과 삭제 버튼은 유지한다', () => {
    const { container } = renderPage({ mode: 'new' });
    attach(container, [makeFile('broken.heic', 1024, 'image/heic')]);

    const img = container.querySelector('img') as HTMLImageElement;
    fireEvent.error(img);

    expect(screen.getByText('미리보기를 표시할 수 없어요')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('broken.heic')).toBeInTheDocument();
    expect(deleteButton('broken.heic')).toBeInTheDocument();
  });

  it('로드에 성공한 썸네일에는 안내 문구가 없다', () => {
    const { container } = renderPage({ mode: 'new' });
    attach(container, [makeFile('ok.png')]);

    expect(
      screen.queryByText('미리보기를 표시할 수 없어요'),
    ).not.toBeInTheDocument();
  });
});
