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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  closeInquiry,
  deleteInquiry,
  deleteInquiryAttachments,
  getAttachmentUrls,
  getInquiry,
  getInquiryMessages,
  markInquiryRead,
  rateInquiry,
} from '@/entities/inquiry';
import { inquiryQueryKeys } from '@/features/inquiry';
import { useToast } from '@/shared/ui';

import { InquiryDetailPage } from './index';

const SUPABASE = { __supabase: true };

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

vi.mock('@/entities/inquiry', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  closeInquiry: vi.fn(),
  deleteInquiry: vi.fn(),
  deleteInquiryAttachments: vi.fn(),
  getAttachmentUrls: vi.fn(),
  getInquiry: vi.fn(),
  getInquiryMessages: vi.fn(),
  markInquiryRead: vi.fn(),
  rateInquiry: vi.fn(),
}));

const NETWORK_ERROR_TEXT = '연결이 불안정해요. 잠시 후 다시 시도해주세요.';

type Status = 'waiting' | 'in_progress' | 'answered' | 'closed';

const makeInquiry = (
  overrides: Partial<{
    status: Status;
    category: string | null;
    hasUnreadReply: boolean;
    rating: number | null;
  }> = {},
) => ({
  id: 'inq-1',
  userId: 'user-1',
  title: '동기화 후 내역이 사라졌어요',
  status: 'answered' as Status,
  category: 'account_login' as string | null,
  deviceInfo: null,
  hasUnreadReply: false,
  rating: null as number | null,
  waitingSince: '2026-10-01T00:12:00Z',
  createdAt: '2026-10-01T00:12:00Z',
  updatedAt: '2026-10-01T05:20:00Z',
  ...overrides,
});

const makeMessage = (
  id: string,
  kind: 'question' | 'reply' | 'memo',
  body: string,
  createdAt: string,
  attachments: string[] = [],
) => ({ id, inquiryId: 'inq-1', kind, body, attachments, createdAt });

const QUESTION = makeMessage(
  'm1',
  'question',
  '휴대폰을 바꾼 뒤 내역이 안 보여요.',
  '2026-10-01T00:12:00Z',
);
const REPLY = makeMessage(
  'm2',
  'reply',
  '설정에서 동기화를 눌러주세요.',
  '2026-10-01T05:20:00Z',
);
const FOLLOW_UP = makeMessage(
  'm3',
  'question',
  '그래도 안 돼서 다시 문의드려요.',
  '2026-10-01T06:00:00Z',
);

const deferred = <T = void,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const createClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderPage = ({ strict = false }: { strict?: boolean } = {}) => {
  const client = createClient();
  const page = (
    <QueryClientProvider client={client}>
      <InquiryDetailPage inquiryId="inq-1" />
    </QueryClientProvider>
  );
  const result = render(strict ? <StrictMode>{page}</StrictMode> : page);
  return { ...result, client };
};

const setData = (
  inquiry: ReturnType<typeof makeInquiry>,
  messages: ReturnType<typeof makeMessage>[] = [QUESTION],
) => {
  vi.mocked(getInquiry).mockResolvedValue(inquiry as never);
  vi.mocked(getInquiryMessages).mockResolvedValue(messages as never);
};

const statusText = () =>
  screen
    .getAllByRole('status')
    .map((element) => element.textContent)
    .join(' ');

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

const waitForIdle = (client: {
  isFetching: () => number;
  isMutating: () => number;
}) =>
  waitFor(() => {
    expect(client.isFetching()).toBe(0);
    expect(client.isMutating()).toBe(0);
  });

const photoName = (number: number, owner = '내 문의') =>
  `${owner} 첨부 사진 ${number} 크게 보기`;

const findPhotoButton = (number: number, owner?: string) =>
  screen.findByRole('button', { name: photoName(number, owner) });

const flush = () => act(async () => {});

const waitForPage = () => screen.findByText('동기화 후 내역이 사라졌어요');

beforeEach(() => {
  vi.clearAllMocks();
  safeBack.useSafeBack.mockImplementation(() => safeBack.goBack);
  act(() => useToast.setState({ message: null, tone: 'default' }));
  setData(makeInquiry());
  vi.mocked(getAttachmentUrls).mockImplementation((async (
    _supabase: unknown,
    paths: string[],
  ) =>
    paths.map((path) => ({
      path,
      url: path.includes('bad') ? null : `https://signed.test/${path}`,
    }))) as never);
  vi.mocked(markInquiryRead).mockResolvedValue(undefined);
  vi.mocked(closeInquiry).mockResolvedValue(undefined);
  vi.mocked(rateInquiry).mockResolvedValue(undefined);
  vi.mocked(deleteInquiry).mockResolvedValue(undefined);
  vi.mocked(deleteInquiryAttachments).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('InquiryDetailPage', () => {
  describe('로딩과 live region', () => {
    it('불러오는 동안 aria-busy 영역을 보이고 <h1> "문의 상세" 는 이미 있다', () => {
      vi.mocked(getInquiry).mockReturnValue(new Promise(() => {}));
      const { container } = renderPage();

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: '문의 상세' }),
      ).toBeInTheDocument();
    });

    it('role="status" live region 이 로딩 중에도 마운트돼 있고 비어 있다', () => {
      vi.mocked(getInquiry).mockReturnValue(new Promise(() => {}));
      renderPage();

      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      expect(statusText().trim()).toBe('');
    });
  });

  describe('헤더와 메타', () => {
    it('뒤로 가기는 useSafeBack("/support/inquiries") 의 goBack 이다', async () => {
      renderPage();
      await waitForPage();

      expect(safeBack.useSafeBack).toHaveBeenCalledWith('/support/inquiries');

      fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

      expect(safeBack.goBack).toHaveBeenCalledTimes(1);
      expect(router.push).not.toHaveBeenCalled();
    });

    it('상태 뱃지, 카테고리 라벨, "MM.DD HH:mm" 일시를 보여준다', async () => {
      renderPage();
      await waitForPage();

      expect(screen.getByText('답변 완료')).toBeInTheDocument();
      expect(screen.getByText(/계정·로그인/)).toBeInTheDocument();
      expect(screen.getByText(/10\.01 09:12/)).toBeInTheDocument();
    });

    it('미분류 문의는 카테고리 자리에 "접수됨" 을 보인다', async () => {
      setData(makeInquiry({ category: null }));
      renderPage();
      await waitForPage();

      expect(screen.getByText(/접수됨/)).toBeInTheDocument();
    });

    it('in_progress 는 "답변 대기" 로 보인다', async () => {
      setData(makeInquiry({ status: 'in_progress' }));
      renderPage();
      await waitForPage();

      expect(screen.getByText('답변 대기')).toBeInTheDocument();
    });
  });

  describe('스레드', () => {
    it('질문 카드(제목+본문) → 운영자 답변 → 추가 문의(본문만) 순서로 시간순 렌더링한다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY, FOLLOW_UP]);
      renderPage();

      const question = await screen.findByText(QUESTION.body);
      const reply = screen.getByText(REPLY.body);
      const followUp = screen.getByText(FOLLOW_UP.body);

      const before = (a: HTMLElement, b: HTMLElement) =>
        Boolean(
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
      expect(before(question, reply)).toBe(true);
      expect(before(reply, followUp)).toBe(true);
      expect(screen.getAllByText('동기화 후 내역이 사라졌어요')).toHaveLength(
        1,
      );
    });

    it('운영자 답변에는 "운영자 답변 · MM.DD HH:mm" 라벨이 붙는다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY]);
      renderPage();

      expect(
        await screen.findByText('운영자 답변 · 10.01 14:20'),
      ).toBeInTheDocument();
    });

    it('운영자 답변 라벨은 <h2> 이고 답변 카드(article)가 그 제목으로 이름 붙는다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY]);
      renderPage();

      expect(
        await screen.findByRole('heading', {
          level: 2,
          name: '운영자 답변 · 10.01 14:20',
        }),
      ).toBeInTheDocument();
      const article = screen.getByRole('article', {
        name: '운영자 답변 · 10.01 14:20',
      });
      expect(within(article).getByText(REPLY.body)).toBeInTheDocument();
    });

    it('추가 문의 카드도 "추가 문의 · MM.DD HH:mm" <h2> 로 이름 붙는다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY, FOLLOW_UP]);
      renderPage();

      expect(
        await screen.findByRole('heading', {
          level: 2,
          name: '추가 문의 · 10.01 15:00',
        }),
      ).toBeInTheDocument();
      const article = screen.getByRole('article', {
        name: '추가 문의 · 10.01 15:00',
      });
      expect(within(article).getByText(FOLLOW_UP.body)).toBeInTheDocument();
    });

    it('질문 카드는 문의 제목을 <h2> 로 유지한다', async () => {
      renderPage();

      expect(
        await screen.findByRole('heading', {
          level: 2,
          name: '동기화 후 내역이 사라졌어요',
        }),
      ).toBeInTheDocument();
    });

    it('내부 메모는 데이터에 섞여 와도 렌더링하지 않는다', async () => {
      setData(makeInquiry(), [
        QUESTION,
        makeMessage('m9', 'memo', '내부 메모입니다', '2026-10-01T01:00:00Z'),
        REPLY,
      ]);
      renderPage();
      await screen.findByText(REPLY.body);

      expect(screen.queryByText('내부 메모입니다')).not.toBeInTheDocument();
    });

    it('메시지 조회가 실패해도 헤더와 메타는 남고 스레드 영역에 인라인 "다시 시도" 를 보인다', async () => {
      vi.mocked(getInquiryMessages).mockRejectedValue(new Error('network'));
      renderPage();

      expect(await screen.findByText(NETWORK_ERROR_TEXT)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: '문의 상세' }),
      ).toBeInTheDocument();
      expect(screen.getByText('답변 완료')).toBeInTheDocument();

      vi.mocked(getInquiryMessages).mockResolvedValue([
        QUESTION,
        REPLY,
      ] as never);
      fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

      expect(await screen.findByText(REPLY.body)).toBeInTheDocument();
      expect(screen.queryByText(NETWORK_ERROR_TEXT)).not.toBeInTheDocument();
    });
  });

  describe('첨부 사진', () => {
    const withPhotos = (paths = ['u/inq-1/a.jpg', 'u/inq-1/b.jpg']) =>
      setData(makeInquiry(), [{ ...QUESTION, attachments: paths }]);

    it('서명 URL 로 썸네일을 보이고 이미지는 장식(alt="")이며 버튼이 이름과 팝업 종류를 가진다', async () => {
      withPhotos();
      renderPage();

      const first = await findPhotoButton(1);
      const second = await findPhotoButton(2);

      expect(first).toHaveAttribute('aria-haspopup', 'dialog');
      expect(second).toHaveAttribute('aria-haspopup', 'dialog');
      const firstImage = first.querySelector('img') as HTMLImageElement;
      const secondImage = second.querySelector('img') as HTMLImageElement;
      expect(firstImage).toHaveAttribute(
        'src',
        'https://signed.test/u/inq-1/a.jpg',
      );
      expect(firstImage).toHaveAttribute('alt', '');
      expect(secondImage).toHaveAttribute(
        'src',
        'https://signed.test/u/inq-1/b.jpg',
      );
      expect(secondImage).toHaveAttribute('alt', '');
    });

    it('운영자 답변의 사진 버튼은 "운영자 답변 첨부 사진 N 크게 보기" 로 구분된다', async () => {
      setData(makeInquiry(), [
        { ...QUESTION, attachments: ['u/inq-1/a.jpg'] },
        { ...REPLY, attachments: ['u/inq-1/r.jpg'] },
      ]);
      renderPage();

      expect(await findPhotoButton(1, '내 문의')).toBeInTheDocument();
      expect(await findPhotoButton(1, '운영자 답변')).toBeInTheDocument();
    });

    it('서명에 실패한 사진은 열 수 없는 자리표시(버튼 아님)로 "사진을 불러오지 못했어요" 를 보인다', async () => {
      withPhotos(['u/inq-1/a.jpg', 'u/inq-1/bad.jpg']);
      renderPage();

      expect(
        await screen.findByText('사진을 불러오지 못했어요'),
      ).toBeInTheDocument();
      expect(await findPhotoButton(1)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: photoName(2) }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('사진을 불러오지 못했어요').closest('button'),
      ).toBeNull();
    });

    it('썸네일 이미지 로딩이 실패하면 버튼이 아닌 자리표시로 바뀐다', async () => {
      withPhotos(['u/inq-1/a.jpg']);
      renderPage();
      const button = await findPhotoButton(1);

      fireEvent.error(button.querySelector('img') as Element);

      expect(
        await screen.findByText('사진을 불러오지 못했어요'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: photoName(1) }),
      ).not.toBeInTheDocument();
    });

    it('URL 이 바뀌면(재서명) 썸네일의 실패 표시를 풀고 새 이미지를 다시 보인다', async () => {
      let version = 1;
      vi.mocked(getAttachmentUrls).mockImplementation((async (
        _supabase: unknown,
        paths: string[],
      ) =>
        paths.map((path) => ({
          path,
          url: `https://signed.test/v${version}/${path}`,
        }))) as never);
      withPhotos(['u/inq-1/a.jpg']);
      const { client } = renderPage();
      const button = await findPhotoButton(1);
      expect(button.querySelector('img')).toHaveAttribute(
        'src',
        'https://signed.test/v1/u/inq-1/a.jpg',
      );
      fireEvent.error(button.querySelector('img') as Element);
      await screen.findByText('사진을 불러오지 못했어요');

      version = 2;
      await act(async () => {
        await client.invalidateQueries({
          queryKey: [...inquiryQueryKeys.all, 'attachmentUrls'],
        });
      });

      const recovered = await findPhotoButton(1);
      expect(recovered.querySelector('img')).toHaveAttribute(
        'src',
        'https://signed.test/v2/u/inq-1/a.jpg',
      );
      expect(
        screen.queryByText('사진을 불러오지 못했어요'),
      ).not.toBeInTheDocument();
    });

    it('썸네일을 누르면 "첨부 사진 N / 전체" 이름의 전체 화면 뷰어가 열린다', async () => {
      withPhotos();
      renderPage();
      const thumbnail = await findPhotoButton(2);

      fireEvent.click(thumbnail);

      const dialog = await screen.findByRole('dialog', {
        name: '첨부 사진 2 / 2',
      });
      expect(within(dialog).getByRole('img')).toHaveAttribute(
        'src',
        'https://signed.test/u/inq-1/b.jpg',
      );
    });

    it('뷰어 이미지의 alt 는 비어 있지 않고 대화상자 제목과 다르다', async () => {
      withPhotos();
      renderPage();
      fireEvent.click(await findPhotoButton(1));

      const dialog = await screen.findByRole('dialog');
      const alt = within(dialog).getByRole('img').getAttribute('alt');

      expect(alt).toBeTruthy();
      expect(alt).not.toBe('첨부 사진 1 / 2');
      expect(dialog).toHaveAccessibleName('첨부 사진 1 / 2');
    });

    it('뷰어 이미지 로딩이 실패하면 "사진을 불러오지 못했어요" 를 보이되 뷰어는 열려 있고 조작할 수 있다', async () => {
      withPhotos();
      renderPage();
      fireEvent.click(await findPhotoButton(1));
      const dialog = await screen.findByRole('dialog', {
        name: '첨부 사진 1 / 2',
      });

      fireEvent.error(within(dialog).getByRole('img'));

      expect(
        within(dialog).getByText('사진을 불러오지 못했어요'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('dialog', { name: '첨부 사진 1 / 2' }),
      ).toBeInTheDocument();

      fireEvent.click(
        within(dialog).getByRole('button', { name: '다음 사진' }),
      );
      const second = await screen.findByRole('dialog', {
        name: '첨부 사진 2 / 2',
      });
      expect(within(second).getByRole('img')).toHaveAttribute(
        'src',
        'https://signed.test/u/inq-1/b.jpg',
      );
      expect(
        within(second).queryByText('사진을 불러오지 못했어요'),
      ).not.toBeInTheDocument();

      fireEvent.click(within(second).getByRole('button', { name: '닫기' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('"닫기" 로 닫으면 포커스가 눌렀던 썸네일로 돌아간다', async () => {
      withPhotos();
      renderPage();
      const trigger = await findPhotoButton(1);
      trigger.focus();
      fireEvent.click(trigger);
      const dialog = await screen.findByRole('dialog');

      fireEvent.click(within(dialog).getByRole('button', { name: '닫기' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('Esc 로도 닫히고 포커스가 썸네일로 돌아간다', async () => {
      withPhotos();
      renderPage();
      const trigger = await findPhotoButton(1);
      trigger.focus();
      fireEvent.click(trigger);
      await screen.findByRole('dialog');

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('여러 장이면 이전/다음 버튼으로 이동하고, 처음·끝에서는 aria-disabled 로 알리되 포커스는 유지한다', async () => {
      withPhotos();
      renderPage();
      fireEvent.click(await findPhotoButton(1));
      const dialog = await screen.findByRole('dialog', {
        name: '첨부 사진 1 / 2',
      });
      const prev = within(dialog).getByRole('button', { name: '이전 사진' });
      const next = within(dialog).getByRole('button', { name: '다음 사진' });

      expect(prev).toHaveAttribute('aria-disabled', 'true');
      expect(prev).not.toBeDisabled();
      fireEvent.click(prev);
      expect(
        screen.getByRole('dialog', { name: '첨부 사진 1 / 2' }),
      ).toBeInTheDocument();

      fireEvent.click(next);
      const second = await screen.findByRole('dialog', {
        name: '첨부 사진 2 / 2',
      });
      expect(
        within(second).getByRole('button', { name: '다음 사진' }),
      ).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(
        within(second).getByRole('button', { name: '이전 사진' }),
      );
      expect(
        await screen.findByRole('dialog', { name: '첨부 사진 1 / 2' }),
      ).toBeInTheDocument();
    });

    it('뷰어에는 항상 마운트된 role="status" 가 있고 이동하면 "{현재} / {불러온 사진 수}" 를 알린다', async () => {
      withPhotos();
      renderPage();
      fireEvent.click(await findPhotoButton(1));
      const dialog = await screen.findByRole('dialog', {
        name: '첨부 사진 1 / 2',
      });
      const status = within(dialog).getByRole('status');

      fireEvent.click(
        within(dialog).getByRole('button', { name: '다음 사진' }),
      );

      await waitFor(() => expect(status).toHaveTextContent('2 / 2'));
    });

    it('서명에 실패한 사진은 "불러온 사진 수" 에서 빠진다 (사진 3장 중 2장 성공 -> "2 / 2")', async () => {
      withPhotos(['u/inq-1/a.jpg', 'u/inq-1/bad.jpg', 'u/inq-1/c.jpg']);
      renderPage();
      fireEvent.click(await findPhotoButton(1));
      const dialog = await screen.findByRole('dialog');

      fireEvent.click(
        within(dialog).getByRole('button', { name: '다음 사진' }),
      );

      const moved = await screen.findByRole('dialog', {
        name: '첨부 사진 3 / 3',
      });
      await waitFor(() =>
        expect(within(moved).getByRole('status')).toHaveTextContent('2 / 2'),
      );
    });

    it('사진이 한 장이면 이전/다음 버튼이 없다', async () => {
      withPhotos(['u/inq-1/a.jpg']);
      renderPage();
      fireEvent.click(await findPhotoButton(1));

      const dialog = await screen.findByRole('dialog', {
        name: '첨부 사진 1 / 1',
      });

      expect(
        within(dialog).queryByRole('button', { name: '이전 사진' }),
      ).not.toBeInTheDocument();
      expect(
        within(dialog).queryByRole('button', { name: '다음 사진' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('읽음 처리', () => {
    const unreadDetail = () =>
      setData(makeInquiry({ hasUnreadReply: true }), [QUESTION, REPLY]);

    it('미확인 답변이 있고 답변이 화면에 그려지면 markInquiryRead 를 호출한다', async () => {
      unreadDetail();
      renderPage();

      await waitFor(() =>
        expect(markInquiryRead).toHaveBeenCalledWith(SUPABASE, 'inq-1'),
      );
      expect(screen.getByText(REPLY.body)).toBeInTheDocument();
    });

    it('캐시 갱신으로 다시 렌더링돼도(서버가 여전히 미확인이어도) 한 번만 호출한다', async () => {
      unreadDetail();
      const { client } = renderPage();
      await waitFor(() => expect(markInquiryRead).toHaveBeenCalledTimes(1));

      await waitFor(() => expect(getInquiry).toHaveBeenCalledTimes(2));
      await waitForIdle(client);

      expect(markInquiryRead).toHaveBeenCalledTimes(1);
    });

    it('Strict Mode 의 이펙트 이중 실행에도 한 번만 호출한다', async () => {
      unreadDetail();
      const { client } = renderPage({ strict: true });
      await waitFor(() => expect(markInquiryRead).toHaveBeenCalled());
      await waitForIdle(client);

      expect(markInquiryRead).toHaveBeenCalledTimes(1);
    });

    it('미확인 답변이 없으면 호출하지 않는다', async () => {
      const { client } = renderPage();
      await waitForPage();
      await waitForIdle(client);

      expect(markInquiryRead).not.toHaveBeenCalled();
    });

    it('메시지를 불러오는 동안에는 호출하지 않는다', async () => {
      setData(makeInquiry({ hasUnreadReply: true }), [QUESTION, REPLY]);
      vi.mocked(getInquiryMessages).mockReturnValue(new Promise(() => {}));
      const { client } = renderPage();
      await waitForPage();
      await waitFor(() =>
        expect(
          client.getQueryState(inquiryQueryKeys.detail('inq-1'))?.status,
        ).toBe('success'),
      );
      await flush();

      expect(markInquiryRead).not.toHaveBeenCalled();
    });

    it('메시지 조회가 실패한 동안에는 호출하지 않는다', async () => {
      setData(makeInquiry({ hasUnreadReply: true }), [QUESTION, REPLY]);
      vi.mocked(getInquiryMessages).mockRejectedValue(new Error('network'));
      const { client } = renderPage();
      await waitFor(() =>
        expect(
          client.getQueryState(inquiryQueryKeys.messages('inq-1'))?.status,
        ).toBe('error'),
      );
      await waitForIdle(client);

      expect(markInquiryRead).not.toHaveBeenCalled();
    });

    it('미확인이어도 답변(reply) 메시지가 없으면 호출하지 않는다', async () => {
      setData(makeInquiry({ hasUnreadReply: true, status: 'waiting' }), [
        QUESTION,
      ]);
      const { client } = renderPage();
      await screen.findByText(QUESTION.body);
      await waitForIdle(client);

      expect(markInquiryRead).not.toHaveBeenCalled();
    });

    it('서버 값이 hasUnreadReply=false 가 되면 가드가 풀려, 이후 다시 true 로 오면 다시 읽음 처리한다', async () => {
      let unread = true;
      vi.mocked(getInquiry).mockImplementation((async () =>
        makeInquiry({ hasUnreadReply: unread })) as never);
      vi.mocked(getInquiryMessages).mockResolvedValue([
        QUESTION,
        REPLY,
      ] as never);
      vi.mocked(markInquiryRead).mockImplementation((async () => {
        unread = false;
      }) as never);
      const { client } = renderPage();
      await waitFor(() => expect(markInquiryRead).toHaveBeenCalledTimes(1));
      await waitForIdle(client);
      // 읽음 처리 뒤 갱신된 서버 값(false)이 화면에 반영될 때까지 기다린다.
      await waitFor(() =>
        expect(
          client.getQueryData<{ hasUnreadReply: boolean }>(
            inquiryQueryKeys.detail('inq-1'),
          )?.hasUnreadReply,
        ).toBe(false),
      );

      unread = true;
      await act(async () => {
        await client.invalidateQueries({
          queryKey: inquiryQueryKeys.detail('inq-1'),
        });
      });

      await waitFor(() => expect(markInquiryRead).toHaveBeenCalledTimes(2));
    });

    it('읽음 처리가 실패해도 화면은 그대로 보이고 사용자에게 오류를 띄우지 않는다', async () => {
      vi.mocked(markInquiryRead).mockRejectedValue(new Error('rpc'));
      unreadDetail();
      const { client } = renderPage();

      await waitFor(() => expect(markInquiryRead).toHaveBeenCalled());
      await waitForIdle(client);

      expect(screen.getByText(REPLY.body)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(useToast.getState().message).toBeNull();
    });
  });

  describe('수정 / 삭제 진입', () => {
    it('답변 대기 중이고 답변이 없으면 "수정" 링크가 편집 모드 작성 화면을 가리킨다', async () => {
      setData(makeInquiry({ status: 'waiting' }), [QUESTION]);
      renderPage();

      expect(
        await screen.findByRole('link', { name: '문의 수정' }),
      ).toHaveAttribute('href', '/support/inquiries/new?edit=inq-1');
    });

    it('waiting 이어도 이미 답변이 있으면(추가 문의 후) "수정" 은 없다', async () => {
      setData(makeInquiry({ status: 'waiting' }), [QUESTION, REPLY, FOLLOW_UP]);
      renderPage();
      await screen.findByText(REPLY.body);

      expect(
        screen.queryByRole('link', { name: '문의 수정' }),
      ).not.toBeInTheDocument();
    });

    it.each(['in_progress', 'answered', 'closed'] as const)(
      '%s 상태에서는 "수정" 이 없다',
      async (status) => {
        setData(makeInquiry({ status }), [QUESTION]);
        renderPage();
        await waitForPage();

        expect(
          screen.queryByRole('link', { name: '문의 수정' }),
        ).not.toBeInTheDocument();
      },
    );

    it('메시지를 아직 모르는 동안에는 "수정" 을 보이지 않는다', async () => {
      setData(makeInquiry({ status: 'waiting' }));
      vi.mocked(getInquiryMessages).mockReturnValue(new Promise(() => {}));
      renderPage();
      await waitForPage();

      expect(
        screen.queryByRole('link', { name: '문의 수정' }),
      ).not.toBeInTheDocument();
    });

    it('"수정" 링크의 보이는 글자는 "수정" 이고 접근 가능한 이름은 "문의 수정" 이다', async () => {
      setData(makeInquiry({ status: 'waiting' }), [QUESTION]);
      renderPage();

      expect(
        await screen.findByRole('link', { name: '문의 수정' }),
      ).toHaveTextContent('수정');
    });

    it('"수정" 자리는 수정할 수 없는 상태에서도 비워 둔 채 예약돼(data-slot="edit-action") "삭제" 가 밀리지 않는다', async () => {
      setData(makeInquiry({ status: 'answered' }), [QUESTION, REPLY]);
      const { container } = renderPage();
      await screen.findByText(REPLY.body);

      const slot = container.querySelector('[data-slot="edit-action"]');
      expect(slot).toBeInTheDocument();
      expect(
        within(slot as HTMLElement).queryByRole('link'),
      ).not.toBeInTheDocument();
      expect(slot).not.toContainElement(
        screen.getByRole('button', { name: '문의 삭제' }),
      );
    });

    it('수정 가능해지면 같은 자리(data-slot="edit-action") 안에 링크가 들어간다', async () => {
      setData(makeInquiry({ status: 'waiting' }), [QUESTION]);
      const { container } = renderPage();

      const link = await screen.findByRole('link', { name: '문의 수정' });

      expect(
        container.querySelector('[data-slot="edit-action"]'),
      ).toContainElement(link);
    });

    it('답변이 있어 수정할 수 없는 문의에서도 자리는 남는다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY]);
      const { container } = renderPage();
      await screen.findByText(REPLY.body);

      expect(
        container.querySelector('[data-slot="edit-action"]'),
      ).toBeInTheDocument();
    });

    it.each(['waiting', 'in_progress', 'answered', 'closed'] as const)(
      '%s 상태에서도 "삭제" 버튼(접근 가능한 이름 "문의 삭제")은 항상 있다',
      async (status) => {
        setData(makeInquiry({ status }), [QUESTION]);
        renderPage();
        await waitForPage();

        const button = screen.getByRole('button', { name: '문의 삭제' });

        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('삭제');
      },
    );
  });

  describe('별점', () => {
    const RATING_TITLE = '답변이 도움이 됐나요?';

    const starButton = (n: number) =>
      screen.findByRole('button', { name: `5점 만점에 ${n}점` });

    it('답변이 없으면 별점 블록이 없다', async () => {
      renderPage();
      await waitForPage();

      expect(screen.queryByText(RATING_TITLE)).not.toBeInTheDocument();
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });

    it('<h2> 제목이 라벨인 group 안에 "5점 만점에 N점" 일반 버튼 5개를 보이고 radio 의미는 없다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY]);
      renderPage();

      expect(
        await screen.findByRole('heading', { level: 2, name: RATING_TITLE }),
      ).toBeInTheDocument();
      const group = screen.getByRole('group', { name: RATING_TITLE });
      const buttons = within(group).getAllByRole('button');

      expect(
        buttons.map((button) => button.getAttribute('aria-label')),
      ).toEqual([1, 2, 3, 4, 5].map((n) => `5점 만점에 ${n}점`));
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('aria-checked');
        expect(button).not.toHaveAttribute('role');
      });
    });

    it('"별점은 한 번만 남길 수 있어요" 안내 문구를 보인다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY]);
      renderPage();

      expect(
        await screen.findByText('별점은 한 번만 남길 수 있어요'),
      ).toBeInTheDocument();
    });

    it('방향키는 선택을 옮기거나 확정하지 않는다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY]);
      const { client } = renderPage();
      const first = await starButton(1);
      first.focus();

      fireEvent.keyDown(first, { key: 'ArrowRight' });
      fireEvent.keyDown(first, { key: 'ArrowDown' });
      fireEvent.keyDown(first, { key: 'ArrowLeft' });
      await waitForIdle(client);

      expect(rateInquiry).not.toHaveBeenCalled();
      screen
        .getAllByRole('button', { name: /^5점 만점에 \d점$/ })
        .forEach((button) => {
          expect(button).not.toHaveAttribute('aria-checked');
          expect(button).not.toHaveAttribute('aria-pressed', 'true');
        });
    });

    it('누르면 rateInquiry 를 한 번 호출하고 읽기 전용 "별점 N점을 남겼어요" 로 바뀌며 포커스가 그 문구로 간다', async () => {
      let rating: number | null = null;
      vi.mocked(getInquiry).mockImplementation((async () =>
        makeInquiry({ rating })) as never);
      vi.mocked(getInquiryMessages).mockResolvedValue([
        QUESTION,
        REPLY,
      ] as never);
      vi.mocked(rateInquiry).mockImplementation((async (
        _supabase: unknown,
        payload: { rating: number },
      ) => {
        rating = payload.rating;
      }) as never);
      renderPage();
      const button = await starButton(4);
      button.focus();

      fireEvent.click(button);

      const result = await screen.findByText('별점 4점을 남겼어요');
      expect(rateInquiry).toHaveBeenCalledTimes(1);
      expect(rateInquiry).toHaveBeenCalledWith(SUPABASE, {
        inquiryId: 'inq-1',
        rating: 4,
      });
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
      expect(
        screen.queryAllByRole('button', { name: /5점 만점에/ }),
      ).toHaveLength(0);
      await waitFor(() => expect(result).toHaveFocus());
    });

    it('별점 결과는 한 번만 안내한다 (live region 은 별점을 읽지 않는다)', async () => {
      setData(makeInquiry(), [QUESTION, REPLY]);
      const { client } = renderPage();
      fireEvent.click(await starButton(4));
      await screen.findByText('별점 4점을 남겼어요');
      await waitForIdle(client);

      expect(statusText()).not.toContain('별점');
    });

    it('이미 남긴 별점은 처음부터 읽기 전용이며 바꿀 수 없다', async () => {
      setData(makeInquiry({ rating: 3 }), [QUESTION, REPLY]);
      renderPage();

      expect(
        await screen.findByText('별점 3점을 남겼어요'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
      expect(
        screen.queryAllByRole('button', { name: /5점 만점에/ }),
      ).toHaveLength(0);
      expect(rateInquiry).not.toHaveBeenCalled();
    });

    it.each(['waiting', 'closed'] as const)(
      '%s 상태여도 저장된 별점은 읽기 전용으로 보인다',
      async (status) => {
        setData(makeInquiry({ status, rating: 2 }), [QUESTION, REPLY]);
        renderPage();

        expect(
          await screen.findByText('별점 2점을 남겼어요'),
        ).toBeInTheDocument();
        expect(screen.queryByRole('group')).not.toBeInTheDocument();
      },
    );

    it('종결(closed)된 문의도 답변이 있고 별점이 없으면 입력을 보인다', async () => {
      setData(makeInquiry({ status: 'closed' }), [QUESTION, REPLY]);
      renderPage();

      expect(await starButton(5)).toBeInTheDocument();
    });

    it.each(['waiting', 'in_progress'] as const)(
      '%s 상태에서는 예전 답변이 있어도(추가 문의 뒤) 별점 입력을 보이지 않는다',
      async (status) => {
        setData(makeInquiry({ status }), [QUESTION, REPLY, FOLLOW_UP]);
        const { client } = renderPage();
        await screen.findByText(REPLY.body);
        await waitForIdle(client);

        expect(screen.queryByText(RATING_TITLE)).not.toBeInTheDocument();
        expect(screen.queryByRole('group')).not.toBeInTheDocument();
        expect(
          screen.queryAllByRole('button', { name: /5점 만점에/ }),
        ).toHaveLength(0);
      },
    );

    it('저장 중 다른 별을 눌러도 요청은 한 번만 나간다', async () => {
      const pending = deferred();
      vi.mocked(rateInquiry).mockReturnValue(pending.promise as never);
      setData(makeInquiry(), [QUESTION, REPLY]);
      renderPage();
      const four = await starButton(4);
      const five = await starButton(5);

      fireEvent.click(four);
      fireEvent.click(five);

      await waitFor(() => expect(rateInquiry).toHaveBeenCalledTimes(1));
      await flush();
      expect(rateInquiry).toHaveBeenCalledTimes(1);
      expect(rateInquiry).toHaveBeenCalledWith(SUPABASE, {
        inquiryId: 'inq-1',
        rating: 4,
      });
      await act(async () => pending.resolve());
    });

    it('실패하면 인라인 alert 로 알리고(토스트 없음) 선택을 되돌려 다시 고를 수 있다', async () => {
      vi.mocked(rateInquiry).mockRejectedValueOnce(new Error('rpc'));
      setData(makeInquiry(), [QUESTION, REPLY]);
      renderPage();
      fireEvent.click(await starButton(4));

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent(
        '별점을 남기지 못했어요. 다시 시도해주세요.',
      );
      expect(alert).not.toHaveTextContent('rpc');
      expect(useToast.getState().message).toBeNull();
      expect(
        screen.queryByText(/별점 \d점을 남겼어요/),
      ).not.toBeInTheDocument();
      const group = screen.getByRole('group', { name: RATING_TITLE });
      const buttons = within(group).getAllByRole('button');
      expect(buttons).toHaveLength(5);
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('aria-pressed', 'true');
        expect(button).not.toHaveAttribute('aria-checked');
      });

      fireEvent.click(await starButton(5));
      await waitFor(() => expect(rateInquiry).toHaveBeenCalledTimes(2));
    });
  });

  describe('하단 버튼', () => {
    it('answered 이면 "추가 문의" 링크와 "해결됐어요" 버튼을 보인다', async () => {
      renderPage();

      expect(
        await screen.findByRole('link', { name: '추가 문의' }),
      ).toHaveAttribute('href', '/support/inquiries/new?followUp=inq-1');
      expect(
        screen.getByRole('button', { name: '해결됐어요' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: '새 문의하기' }),
      ).not.toBeInTheDocument();
    });

    it('closed 이면 "새 문의하기" 링크만 보인다', async () => {
      setData(makeInquiry({ status: 'closed' }));
      renderPage();

      expect(
        await screen.findByRole('link', { name: '새 문의하기' }),
      ).toHaveAttribute('href', '/support/inquiries/new');
      expect(
        screen.queryByRole('link', { name: '추가 문의' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: '해결됐어요' }),
      ).not.toBeInTheDocument();
    });

    it.each(['waiting', 'in_progress'] as const)(
      '%s 이면 하단 버튼이 없다',
      async (status) => {
        setData(makeInquiry({ status }));
        renderPage();
        await waitForPage();

        expect(
          screen.queryByRole('link', { name: '추가 문의' }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: '해결됐어요' }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('link', { name: '새 문의하기' }),
        ).not.toBeInTheDocument();
      },
    );

    describe('종결 확인 다이얼로그', () => {
      const openCloseDialog = async () => {
        const trigger = await screen.findByRole('button', {
          name: '해결됐어요',
        });
        trigger.focus();
        fireEvent.click(trigger);
        const dialog = await screen.findByRole('alertdialog', {
          name: '문의를 종결할까요?',
        });
        return { trigger, dialog };
      };

      const confirmButton = (dialog: HTMLElement) =>
        within(dialog).getByRole('button', { name: '종결하기' });

      it('"해결됐어요" 는 closeInquiry 를 바로 호출하지 않고 안전한 "취소" 에 포커스를 둔 alertdialog 를 연다', async () => {
        renderPage();

        const { dialog } = await openCloseDialog();

        expect(
          within(dialog).getByText('종결하면 추가 문의를 이어갈 수 없어요.'),
        ).toBeInTheDocument();
        expect(
          within(dialog).getByRole('button', { name: '취소' }),
        ).toHaveFocus();
        expect(confirmButton(dialog)).toBeInTheDocument();
        expect(closeInquiry).not.toHaveBeenCalled();
      });

      it('"취소" 와 Esc 는 종결하지 않고 닫으며 포커스가 "해결됐어요" 로 돌아간다', async () => {
        const { client } = renderPage();
        const { dialog, trigger } = await openCloseDialog();

        fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();

        fireEvent.click(trigger);
        await screen.findByRole('alertdialog');
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        await waitForIdle(client);
        expect(closeInquiry).not.toHaveBeenCalled();
      });

      it('확인을 연속으로 눌러도 closeInquiry 는 한 번만 호출된다', async () => {
        const pending = deferred();
        vi.mocked(closeInquiry).mockReturnValue(pending.promise as never);
        renderPage();
        const { dialog } = await openCloseDialog();
        const confirm = confirmButton(dialog);

        fireEvent.click(confirm);
        fireEvent.click(confirm);

        await waitFor(() => expect(closeInquiry).toHaveBeenCalledTimes(1));
        await flush();
        expect(closeInquiry).toHaveBeenCalledTimes(1);
        expect(closeInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-1');
        await act(async () => pending.resolve());
      });

      it('처리 중에는 Esc 로 닫히지 않는다', async () => {
        const pending = deferred();
        vi.mocked(closeInquiry).mockReturnValue(pending.promise as never);
        renderPage();
        const { dialog } = await openCloseDialog();
        fireEvent.click(confirmButton(dialog));
        await waitFor(() => expect(closeInquiry).toHaveBeenCalled());

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        await act(async () => pending.resolve());
      });

      it('성공하면 다이얼로그가 닫히고 상태가 "종결", 하단은 "새 문의하기" 가 된다', async () => {
        let closed = false;
        vi.mocked(getInquiry).mockImplementation((async () =>
          makeInquiry({ status: closed ? 'closed' : 'answered' })) as never);
        vi.mocked(closeInquiry).mockImplementation((async () => {
          closed = true;
        }) as never);
        renderPage();
        const { dialog } = await openCloseDialog();

        fireEvent.click(confirmButton(dialog));

        expect(
          await screen.findByRole('link', { name: '새 문의하기' }),
        ).toHaveAttribute('href', '/support/inquiries/new');
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.getByText('종결')).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: '해결됐어요' }),
        ).not.toBeInTheDocument();
      });

      it('결과 안내는 한 번만: 포커스가 "새 문의하기" 로 가고 live region 은 조용하다', async () => {
        let closed = false;
        vi.mocked(getInquiry).mockImplementation((async () =>
          makeInquiry({ status: closed ? 'closed' : 'answered' })) as never);
        vi.mocked(closeInquiry).mockImplementation((async () => {
          closed = true;
        }) as never);
        const { client } = renderPage();
        const { dialog } = await openCloseDialog();

        fireEvent.click(confirmButton(dialog));

        const link = await screen.findByRole('link', { name: '새 문의하기' });
        await waitFor(() => expect(link).toHaveFocus());
        await waitForIdle(client);
        expect(document.body).not.toHaveFocus();
        expect(statusText()).not.toContain('문의를 종결했어요');
      });

      it('실패하면 다이얼로그를 열어 둔 채 안에 고정 문구 alert 를 보이고(원본 오류 문구·토스트 없음) 다시 시도할 수 있다', async () => {
        vi.mocked(closeInquiry).mockRejectedValueOnce(new Error('rpc down'));
        renderPage();
        const { dialog } = await openCloseDialog();

        fireEvent.click(confirmButton(dialog));

        const alert = await within(dialog).findByRole('alert');
        expect(alert).toHaveTextContent(
          '처리하지 못했어요. 다시 시도해주세요.',
        );
        expect(alert).not.toHaveTextContent('rpc down');
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        expect(useToast.getState().message).toBeNull();
        expect(
          screen.queryByRole('link', { name: '새 문의하기' }),
        ).not.toBeInTheDocument();

        fireEvent.click(confirmButton(dialog));
        await waitFor(() => expect(closeInquiry).toHaveBeenCalledTimes(2));
      });

      it('종결에 실패한 뒤 다른 경로로 closed 가 되어도 포커스를 빼앗지 않는다', async () => {
        vi.mocked(closeInquiry).mockRejectedValueOnce(new Error('rpc'));
        const { client } = renderPage();
        const { dialog } = await openCloseDialog();
        fireEvent.click(confirmButton(dialog));
        await within(dialog).findByRole('alert');
        fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
        await waitForIdle(client);

        vi.mocked(getInquiry).mockResolvedValue(
          makeInquiry({ status: 'closed' }) as never,
        );
        await act(async () => {
          await client.invalidateQueries({
            queryKey: inquiryQueryKeys.detail('inq-1'),
          });
        });

        const link = await screen.findByRole('link', { name: '새 문의하기' });
        await flush();
        expect(link).not.toHaveFocus();
      });
    });
  });

  describe('삭제', () => {
    const openDialog = async () => {
      const trigger = await screen.findByRole('button', {
        name: '문의 삭제',
      });
      trigger.focus();
      fireEvent.click(trigger);
      return {
        trigger,
        dialog: await screen.findByRole('alertdialog'),
      };
    };

    it('"삭제" 는 alertdialog 를 열고 안전한 "취소" 에 기본 포커스를 둔다', async () => {
      renderPage();

      const { dialog } = await openDialog();

      expect(
        within(dialog).getByRole('button', { name: '취소' }),
      ).toHaveFocus();
    });

    it('확인 버튼은 danger 톤이지만 subtle 강조다', async () => {
      renderPage();

      const { dialog } = await openDialog();

      expect(
        within(dialog).getByRole('button', { name: '삭제' }),
      ).toHaveAttribute('data-emphasis', 'subtle');
    });

    it('답변이 없으면 되돌릴 수 없다는 기본 문구를 보인다', async () => {
      setData(makeInquiry({ status: 'waiting' }), [QUESTION]);
      renderPage();

      const { dialog } = await openDialog();

      expect(
        within(dialog).getByText(
          '문의를 삭제할까요? 삭제하면 되돌릴 수 없어요.',
        ),
      ).toBeInTheDocument();
    });

    it('답변이 있으면 답변도 함께 사라진다는 문구를 보인다', async () => {
      setData(makeInquiry(), [QUESTION, REPLY]);
      renderPage();
      await screen.findByText(REPLY.body);

      const { dialog } = await openDialog();

      expect(
        within(dialog).getByText(
          '삭제하면 답변도 함께 사라지고 되돌릴 수 없어요.',
        ),
      ).toBeInTheDocument();
    });

    it.each([
      [
        '불러오는 중',
        () =>
          vi.mocked(getInquiryMessages).mockReturnValue(new Promise(() => {})),
      ],
      [
        '불러오기 실패',
        () =>
          vi.mocked(getInquiryMessages).mockRejectedValue(new Error('network')),
      ],
    ])(
      '메시지를 모르는 동안(%s)에는 답변이 있을 수 있어 더 강한 문구를 보인다',
      async (_label, arrange) => {
        setData(makeInquiry({ status: 'waiting' }), [QUESTION]);
        arrange();
        renderPage();
        await waitForPage();

        const { dialog } = await openDialog();

        expect(
          within(dialog).getByText(
            '삭제하면 답변도 함께 사라지고 되돌릴 수 없어요.',
          ),
        ).toBeInTheDocument();
      },
    );

    it('"취소" 와 Esc 는 삭제하지 않고 닫으며 포커스가 "삭제" 버튼으로 돌아간다', async () => {
      renderPage();
      const { dialog, trigger } = await openDialog();

      fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(deleteInquiry).not.toHaveBeenCalled();

      fireEvent.click(trigger);
      await screen.findByRole('alertdialog');
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(deleteInquiry).not.toHaveBeenCalled();
    });

    it('확인하면 행을 먼저 지운 뒤 첨부를 정리하고, 목록으로 replace 하며 삭제 토스트를 띄운다', async () => {
      setData(makeInquiry(), [
        { ...QUESTION, attachments: ['u/inq-1/a.jpg'] },
        { ...REPLY, attachments: ['u/inq-1/r.jpg'] },
      ]);
      renderPage();
      await screen.findByText(REPLY.body);
      const { dialog } = await openDialog();

      fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith('/support/inquiries'),
      );
      expect(router.replace).toHaveBeenCalledTimes(1);
      expect(router.push).not.toHaveBeenCalled();
      expect(deleteInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-1');
      expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, [
        'u/inq-1/a.jpg',
        'u/inq-1/r.jpg',
      ]);
      expect(vi.mocked(deleteInquiry).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(deleteInquiryAttachments).mock.invocationCallOrder[0],
      );
      await settle();
      expect(useToast.getState().message).toBe('문의를 삭제했어요.');
      expect(getInquiry).toHaveBeenCalledTimes(1);
    });

    it('삭제에 성공한 뒤 "삭제된 문의예요." 토스트를 띄우지 않고 상세를 다시 조회하지도 않는다', async () => {
      let deleted = false;
      vi.mocked(getInquiry).mockImplementation((async () =>
        deleted ? null : makeInquiry()) as never);
      vi.mocked(deleteInquiry).mockImplementation((async () => {
        deleted = true;
      }) as never);
      const { client } = renderPage();
      await waitForPage();
      const { dialog } = await openDialog();

      fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith('/support/inquiries'),
      );
      await waitForIdle(client);
      expect(useToast.getState().message).toBe('문의를 삭제했어요.');
      expect(useToast.getState().message).not.toBe('삭제된 문의예요.');
      expect(getInquiry).toHaveBeenCalledTimes(1);
      expect(router.replace).toHaveBeenCalledTimes(1);
    });

    it('Storage 정리가 실패해도 삭제는 성공으로 처리한다', async () => {
      vi.mocked(deleteInquiryAttachments).mockRejectedValue(
        new Error('storage'),
      );
      setData(makeInquiry(), [{ ...QUESTION, attachments: ['u/inq-1/a.jpg'] }]);
      renderPage();
      await waitForPage();
      const { dialog } = await openDialog();

      fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith('/support/inquiries'),
      );
      await settle();
      expect(useToast.getState().message).toBe('문의를 삭제했어요.');
    });

    it('확인을 연속으로 눌러도 deleteInquiry 는 한 번만 호출된다', async () => {
      const pending = deferred();
      vi.mocked(deleteInquiry).mockReturnValue(pending.promise as never);
      renderPage();
      await waitForPage();
      const { dialog } = await openDialog();
      const confirm = within(dialog).getByRole('button', { name: '삭제' });

      fireEvent.click(confirm);
      fireEvent.click(confirm);

      await waitFor(() => expect(deleteInquiry).toHaveBeenCalledTimes(1));
      await settle();
      expect(deleteInquiry).toHaveBeenCalledTimes(1);
      await act(async () => pending.resolve());
    });

    it('처리 중에 화면이 사라져도 완료 토스트는 사라지지 않는다', async () => {
      const pending = deferred();
      vi.mocked(deleteInquiry).mockReturnValue(pending.promise as never);
      const { unmount } = renderPage();
      await waitForPage();
      const { dialog } = await openDialog();
      fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
      await waitFor(() => expect(deleteInquiry).toHaveBeenCalled());

      unmount();
      await act(async () => pending.resolve());

      await waitFor(() =>
        expect(useToast.getState().message).toBe('문의를 삭제했어요.'),
      );
    });

    it('실패하면 다이얼로그 안에 고정 문구 alert 를 보이고(원본 오류 문구·토스트 없음) 열어 둔 채 다시 시도할 수 있다', async () => {
      vi.mocked(deleteInquiry).mockRejectedValueOnce(new Error('db down'));
      renderPage();
      await waitForPage();
      const { dialog } = await openDialog();

      fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

      const alert = await within(dialog).findByRole('alert');
      expect(alert).toHaveTextContent('삭제하지 못했어요. 다시 시도해주세요.');
      expect(alert).not.toHaveTextContent('db down');
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
      expect(useToast.getState().message).toBeNull();
      expect(deleteInquiryAttachments).not.toHaveBeenCalled();

      fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));
      await waitFor(() => expect(deleteInquiry).toHaveBeenCalledTimes(2));
    });
  });

  describe('없는 문의 / 조회 실패', () => {
    it('이미 삭제됐거나 접근할 수 없는 문의면 목록으로 replace 하고 "삭제된 문의예요." 토스트를 한 번 띄운다', async () => {
      vi.mocked(getInquiry).mockResolvedValue(null as never);
      renderPage();

      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith('/support/inquiries'),
      );
      await settle();

      expect(router.replace).toHaveBeenCalledTimes(1);
      expect(useToast.getState().message).toBe('삭제된 문의예요.');
      expect(
        screen.queryByRole('button', { name: '삭제' }),
      ).not.toBeInTheDocument();
      expect(markInquiryRead).not.toHaveBeenCalled();
    });

    it('조회가 실패하면 오류 상태와 "다시 시도" 를 보이고 누르면 다시 조회한다', async () => {
      vi.mocked(getInquiry).mockRejectedValue(new Error('network'));
      renderPage();

      expect(
        await screen.findByText(NETWORK_ERROR_TEXT, {}, { timeout: 4000 }),
      ).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
      expect(
        screen.getByRole('heading', { level: 1, name: '문의 상세' }),
      ).toBeInTheDocument();

      vi.mocked(getInquiry).mockResolvedValue(makeInquiry() as never);
      fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

      expect(await waitForPage()).toBeInTheDocument();
      expect(screen.queryByText(NETWORK_ERROR_TEXT)).not.toBeInTheDocument();
    }, 10000);
  });
});
