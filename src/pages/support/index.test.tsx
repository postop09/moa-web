import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABELS,
} from '@/entities/inquiry';
import { useFaqs, useIncrementFaqHelpful, useSearchFaqs } from '@/features/faq';
import { useUnreadReplyCount } from '@/features/inquiry';
import { ToastViewport, useToast } from '@/shared/ui';

import { SupportPage } from './index';

vi.mock('@/features/faq', () => ({
  useFaqs: vi.fn(),
  useSearchFaqs: vi.fn(),
  useIncrementFaqHelpful: vi.fn(),
}));

vi.mock('@/features/inquiry', () => ({
  useUnreadReplyCount: vi.fn(),
}));

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
  makeFaq('f2', 'bug_report', '앱이 멈춰요'),
];

const SEARCH_RESULTS = [makeFaq('f3', 'other', '검색된 질문')];

const refetch = vi.fn();
const mutate = vi.fn();

type ListState = {
  data?: unknown[];
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  isPlaceholderData?: boolean;
  /** useSearchFaqs 신규 반환 필드(가정): 입력과 디바운스된 키워드가 다르면 true */
  isDebouncing?: boolean;
  /** useSearchFaqs 신규 반환 필드(가정): 실제 조회에 쓰인 키워드 */
  debouncedKeyword?: string;
};

const listResult = ({
  data,
  isLoading = false,
  isError = false,
  ...rest
}: ListState) =>
  ({
    data,
    isLoading,
    isError,
    isDebouncing: false,
    ...rest,
    refetch,
  }) as never;

type Vote = {
  faqId: string;
  resolve: () => void;
  reject: () => void;
};

/** 호출마다 개별로 성공/실패시킬 수 있는 mutation 목 (mutate/mutateAsync 모두 지원) */
const createControlledMutation = () => {
  const votes: Vote[] = [];
  const start = (faqId: string) => {
    let resolve!: () => void;
    let reject!: () => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = () => res();
      reject = () => rej(new Error('fail'));
    });
    votes.push({ faqId, resolve, reject });
    return promise;
  };
  const mutateAsync = vi.fn((faqId: string) => start(faqId));
  const mutate = vi.fn(
    (
      faqId: string,
      options?: { onSuccess?: () => void; onError?: (e: Error) => void },
    ) => {
      start(faqId).then(
        () => options?.onSuccess?.(),
        (e: Error) => options?.onError?.(e),
      );
    },
  );
  return { votes, mutation: { mutate, mutateAsync, isPending: false } };
};

const setup = ({
  faqs = {} as ListState,
  search = SEARCH_RESULTS as unknown[],
  searchState = {} as ListState,
  unread = 0,
  mutation = { mutate, isPending: false } as unknown,
  withToast = false,
} = {}) => {
  vi.mocked(useFaqs).mockImplementation(((category?: string) =>
    listResult({
      data: category ? FAQS.filter((f) => f.category === category) : FAQS,
      ...faqs,
    })) as never);
  vi.mocked(useSearchFaqs).mockImplementation(((keyword: string) =>
    keyword.trim().length >= 2
      ? listResult({ data: search, ...searchState })
      : listResult({ data: undefined })) as never);
  vi.mocked(useIncrementFaqHelpful).mockReturnValue(mutation as never);
  vi.mocked(useUnreadReplyCount).mockReturnValue({ data: unread } as never);
  return render(
    <>
      <SupportPage />
      {withToast ? <ToastViewport /> : null}
    </>,
  );
};

const SEARCH_PLACEHOLDER = '궁금한 내용을 검색하세요';
const typeSearch = (value: string) =>
  fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
    target: { value },
  });
const isDisabled = (el: HTMLElement) =>
  el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
const chip = (name: string) => screen.getByRole('button', { name });
const openFaq = (question: RegExp) =>
  fireEvent.click(screen.getByRole('button', { name: question }));

describe('SupportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => useToast.setState({ message: null }));
  });

  describe('사칭 주의 배너', () => {
    it('문구가 항상 보이고 닫기 버튼이 없다', () => {
      setup();

      const banner = screen.getByText(
        /운영자는 비밀번호·인증번호를 묻지 않아요/,
      );
      expect(banner).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /닫기/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe('카테고리 칩', () => {
    it('전체 + 문의 카테고리 7개가 칩으로 보인다', () => {
      setup();

      expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
      expect(INQUIRY_CATEGORIES).toHaveLength(7);
      INQUIRY_CATEGORIES.forEach((category) => {
        expect(
          screen.getByRole('button', {
            name: INQUIRY_CATEGORY_LABELS[category],
          }),
        ).toBeInTheDocument();
      });
    });

    it('기본으로 "전체"가 선택돼 있다', () => {
      setup();

      expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(
        screen.getByRole('button', {
          name: INQUIRY_CATEGORY_LABELS.bug_report,
        }),
      ).toHaveAttribute('aria-pressed', 'false');
    });

    it('칩을 선택하면 해당 카테고리 FAQ만 보이고 선택 상태가 바뀐다', () => {
      setup();
      expect(screen.getByText('로그인이 안 돼요')).toBeInTheDocument();
      expect(screen.getByText('앱이 멈춰요')).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', {
          name: INQUIRY_CATEGORY_LABELS.bug_report,
        }),
      );

      expect(screen.getByText('앱이 멈춰요')).toBeInTheDocument();
      expect(screen.queryByText('로그인이 안 돼요')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: INQUIRY_CATEGORY_LABELS.bug_report,
        }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('"전체"를 다시 누르면 모든 FAQ가 돌아온다', () => {
      setup();
      fireEvent.click(
        screen.getByRole('button', {
          name: INQUIRY_CATEGORY_LABELS.bug_report,
        }),
      );

      fireEvent.click(screen.getByRole('button', { name: '전체' }));

      expect(screen.getByText('로그인이 안 돼요')).toBeInTheDocument();
      expect(screen.getByText('앱이 멈춰요')).toBeInTheDocument();
    });
  });

  describe('FAQ 아코디언', () => {
    it('질문 버튼은 처음엔 접혀 있고 답변이 보이지 않는다', () => {
      setup();

      expect(
        screen.getByRole('button', { name: /로그인이 안 돼요/ }),
      ).toHaveAttribute('aria-expanded', 'false');
      expect(
        screen.queryByText('로그인이 안 돼요의 답변입니다'),
      ).not.toBeInTheDocument();
    });

    it('질문을 누르면 답변과 "도움이 됐어요" 버튼이 펼쳐진다', () => {
      setup();

      fireEvent.click(screen.getByRole('button', { name: /로그인이 안 돼요/ }));

      expect(
        screen.getByRole('button', { name: /로그인이 안 돼요/ }),
      ).toHaveAttribute('aria-expanded', 'true');
      expect(
        screen.getByText('로그인이 안 돼요의 답변입니다'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '도움이 됐어요' }),
      ).toBeInTheDocument();
    });

    it('다시 누르면 접힌다', () => {
      setup();
      const question = screen.getByRole('button', { name: /로그인이 안 돼요/ });

      fireEvent.click(question);
      fireEvent.click(question);

      expect(question).toHaveAttribute('aria-expanded', 'false');
      expect(
        screen.queryByText('로그인이 안 돼요의 답변입니다'),
      ).not.toBeInTheDocument();
    });

    it('"도움이 됐어요"를 누르면 mutation이 한 번만 호출되고 완료 상태로 바뀐다', () => {
      setup();
      fireEvent.click(screen.getByRole('button', { name: /로그인이 안 돼요/ }));

      fireEvent.click(screen.getByRole('button', { name: '도움이 됐어요' }));

      expect(mutate).toHaveBeenCalledTimes(1);
      expect(mutate.mock.calls[0][0]).toBe('f1');

      // 완료 상태: 같은 버튼이 사라지거나 비활성화돼 재호출할 수 없다
      const again = screen.queryByRole('button', { name: '도움이 됐어요' });
      if (again) {
        expect(again).toBeDisabled();
        fireEvent.click(again);
      }
      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  describe('검색', () => {
    it('검색 입력창 placeholder가 보인다', () => {
      setup();

      expect(
        screen.getByPlaceholderText('궁금한 내용을 검색하세요'),
      ).toBeInTheDocument();
    });

    it('1자 입력하면 검색 결과 대신 기존 FAQ 목록이 유지된다', () => {
      setup();

      fireEvent.change(
        screen.getByPlaceholderText('궁금한 내용을 검색하세요'),
        {
          target: { value: '검' },
        },
      );

      expect(screen.getByText('로그인이 안 돼요')).toBeInTheDocument();
      expect(screen.queryByText('검색된 질문')).not.toBeInTheDocument();
    });

    it('2자 이상 입력하면 검색 결과를 보여준다', () => {
      setup();

      fireEvent.change(
        screen.getByPlaceholderText('궁금한 내용을 검색하세요'),
        {
          target: { value: '검색' },
        },
      );

      expect(screen.getByText('검색된 질문')).toBeInTheDocument();
      expect(screen.queryByText('로그인이 안 돼요')).not.toBeInTheDocument();
    });

    it('검색 결과가 없으면 빈 상태와 "1:1 문의하기" 링크를 보여준다', () => {
      setup({ search: [] });

      fireEvent.change(
        screen.getByPlaceholderText('궁금한 내용을 검색하세요'),
        {
          target: { value: '없는내용' },
        },
      );

      expect(
        screen.getByText('찾는 답변이 없나요? 직접 문의해주세요.'),
      ).toBeInTheDocument();
      const links = screen.getAllByRole('link', { name: '1:1 문의하기' });
      links.forEach((link) =>
        expect(link).toHaveAttribute('href', '/support/inquiries/new'),
      );
      expect(links.length).toBeGreaterThanOrEqual(2);
    });

    it('FAQ가 있을 땐 검색 빈 상태 문구가 보이지 않는다', () => {
      setup();

      expect(
        screen.queryByText('찾는 답변이 없나요? 직접 문의해주세요.'),
      ).not.toBeInTheDocument();
    });
  });

  describe('내 문의 내역', () => {
    it('/support/inquiries로 가는 링크가 있다', () => {
      setup();

      expect(
        screen.getByRole('link', { name: /내 문의 내역/ }),
      ).toHaveAttribute('href', '/support/inquiries');
    });

    it('미확인 답변이 있으면 "새 답변 N" 뱃지를 보여준다', () => {
      setup({ unread: 3 });

      const link = screen.getByRole('link', { name: /내 문의 내역/ });
      expect(within(link).getByText('새 답변 3')).toBeInTheDocument();
    });

    it('미확인 답변이 0이면 뱃지가 없다', () => {
      setup({ unread: 0 });

      expect(screen.queryByText(/새 답변/)).not.toBeInTheDocument();
    });
  });

  describe('하단 고정 1:1 문의하기', () => {
    it('/support/inquiries/new로 가는 링크와 응답 시간 안내가 보인다', () => {
      setup();

      expect(
        screen.getByRole('link', { name: '1:1 문의하기' }),
      ).toHaveAttribute('href', '/support/inquiries/new');
      expect(
        screen.getByText('평일 기준 1일 이내 답변해요'),
      ).toBeInTheDocument();
    });
  });

  describe('로딩/에러', () => {
    it('로딩 중이면 aria-busy 스켈레톤을 보여주고 FAQ는 없다', () => {
      const { container } = setup({
        faqs: { data: undefined, isLoading: true },
      });

      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(screen.queryByText('로그인이 안 돼요')).not.toBeInTheDocument();
    });

    it('에러면 안내와 "다시 시도" 버튼을 보여주고 누르면 refetch한다', () => {
      setup({ faqs: { data: undefined, isError: true } });

      fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('에러여도 하단 1:1 문의하기 링크는 유지된다', () => {
      setup({ faqs: { data: undefined, isError: true } });

      expect(
        screen.getByRole('link', { name: '1:1 문의하기' }),
      ).toBeInTheDocument();
    });
  });

  describe('검색 로딩 (이전 목록 유지)', () => {
    it('입력 중(디바운스 대기)에는 이전 목록이 유지되고 스켈레톤이 없다', () => {
      const { container } = setup({
        searchState: { data: SEARCH_RESULTS, isDebouncing: true },
      });

      typeSearch('검색어');

      expect(screen.getByText('검색된 질문')).toBeInTheDocument();
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });

    it('검색 첫 조회에 데이터가 전혀 없고 로딩 중일 때만 스켈레톤을 보여준다', () => {
      const { container } = setup({
        searchState: { data: undefined, isLoading: true, isDebouncing: false },
      });

      typeSearch('검색어');

      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    });

    it('스켈레톤 자체는 role="status"를 갖지 않는다', () => {
      const { container } = setup({
        faqs: { data: undefined, isLoading: true },
      });

      const busy = container.querySelector('[aria-busy="true"]');
      expect(busy).not.toBeNull();
      expect(busy?.querySelector('[role="status"]')).toBeNull();
      expect(busy?.getAttribute('role')).not.toBe('status');
    });

    it('카테고리 전환 중 이전 데이터가 유지되면(placeholder) 스켈레톤이 깜빡이지 않는다', () => {
      const { container } = setup({
        faqs: { data: FAQS, isFetching: true, isPlaceholderData: true },
      });

      fireEvent.click(chip(INQUIRY_CATEGORY_LABELS.bug_report));

      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });
  });

  describe('검색 결과 안내 (live region)', () => {
    it('검색 전에는 항상 마운트된 role="status" 영역이 비어 있다', () => {
      setup();

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('검색이 끝나면 "검색 결과 N개"를 읽어준다', () => {
      setup({ search: [...SEARCH_RESULTS, makeFaq('f4', 'other', '또 다른')] });

      typeSearch('검색');

      expect(screen.getByRole('status')).toHaveTextContent('검색 결과 2개');
    });

    it('결과가 없으면 "검색 결과가 없어요"를 읽어준다', () => {
      setup({ search: [] });

      typeSearch('없는내용');

      expect(screen.getByRole('status')).toHaveTextContent(
        '검색 결과가 없어요',
      );
    });

    it('디바운스 대기 중에는 아직 결과를 안내하지 않는다', () => {
      setup({ searchState: { data: SEARCH_RESULTS, isDebouncing: true } });

      typeSearch('검색');

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });
  });

  describe('검색 범위와 칩', () => {
    it('검색 중에는 칩이 DOM에 남되 비활성화되고 "전체에서 검색 중"이 보인다', () => {
      setup();

      typeSearch('검색');

      expect(screen.getByText('전체에서 검색 중')).toBeInTheDocument();
      expect(isDisabled(chip('전체'))).toBe(true);
      INQUIRY_CATEGORIES.forEach((category) => {
        expect(isDisabled(chip(INQUIRY_CATEGORY_LABELS[category]))).toBe(true);
      });
    });

    it('검색을 지우면 칩이 다시 활성화되고 이전 선택이 유지된다', () => {
      setup();
      fireEvent.click(chip(INQUIRY_CATEGORY_LABELS.bug_report));

      typeSearch('검색');
      typeSearch('');

      expect(screen.queryByText('전체에서 검색 중')).not.toBeInTheDocument();
      expect(isDisabled(chip(INQUIRY_CATEGORY_LABELS.bug_report))).toBe(false);
      expect(isDisabled(chip('전체'))).toBe(false);
      expect(chip(INQUIRY_CATEGORY_LABELS.bug_report)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('최소 길이 미만 입력에서는 칩이 활성 상태이고 범위 라벨이 없다', () => {
      setup();

      typeSearch('검');

      expect(screen.queryByText('전체에서 검색 중')).not.toBeInTheDocument();
      expect(isDisabled(chip('전체'))).toBe(false);
    });
  });

  describe('FAQ 빈 목록 상태', () => {
    it('검색이 아닌 빈 목록이면 안내 문구와 1:1 문의하기 링크를 보여준다', () => {
      setup({ faqs: { data: [] } });

      expect(screen.getByText('아직 등록된 질문이 없어요')).toBeInTheDocument();
      const links = screen.getAllByRole('link', { name: '1:1 문의하기' });
      expect(links.length).toBeGreaterThanOrEqual(2);
      links.forEach((link) =>
        expect(link).toHaveAttribute('href', '/support/inquiries/new'),
      );
    });

    it('"전체"가 선택돼 있으면 "전체 질문 보기" 버튼이 없다', () => {
      setup({ faqs: { data: [] } });

      expect(
        screen.queryByRole('button', { name: '전체 질문 보기' }),
      ).not.toBeInTheDocument();
    });

    it('카테고리 선택 중 빈 목록이면 "전체 질문 보기"가 전체를 선택한다', () => {
      setup({ faqs: { data: [] } });
      fireEvent.click(chip(INQUIRY_CATEGORY_LABELS.bug_report));
      expect(chip('전체')).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(screen.getByRole('button', { name: '전체 질문 보기' }));

      expect(chip('전체')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('도움이 됐어요 투표 (호출별 실패 처리)', () => {
    const FAIL_MESSAGE = '의견을 남기지 못했어요. 다시 시도해주세요.';

    const voteOn = (question: RegExp) => {
      openFaq(question);
      fireEvent.click(screen.getByRole('button', { name: '도움이 됐어요' }));
    };

    it('A, B를 연달아 눌러 A만 실패하면 A는 되돌아가고 토스트가 뜨며 B는 투표 상태를 유지한다', async () => {
      const { votes, mutation } = createControlledMutation();
      setup({ mutation, withToast: true });

      voteOn(/로그인이 안 돼요/);
      voteOn(/앱이 멈춰요/);
      expect(votes.map((v) => v.faqId)).toEqual(['f1', 'f2']);

      await act(async () => {
        votes[0].reject();
      });

      expect(screen.getByText(FAIL_MESSAGE)).toBeInTheDocument();
      // A는 다시 투표 가능한 버튼
      const aItem = screen
        .getByRole('button', { name: /로그인이 안 돼요/ })
        .closest('li') as HTMLElement;
      expect(
        within(aItem).getByRole('button', { name: '도움이 됐어요' }),
      ).toBeEnabled();
      // B는 여전히 투표 완료
      const bItem = screen
        .getByRole('button', { name: /앱이 멈춰요/ })
        .closest('li') as HTMLElement;
      expect(
        within(bItem).getByText('의견 주셔서 감사해요'),
      ).toBeInTheDocument();
      expect(
        within(bItem).queryByRole('button', { name: '도움이 됐어요' }),
      ).toBeNull();
    });

    it('두 투표가 모두 실패하면 둘 다 되돌아간다', async () => {
      const { votes, mutation } = createControlledMutation();
      setup({ mutation, withToast: true });

      voteOn(/로그인이 안 돼요/);
      voteOn(/앱이 멈춰요/);

      await act(async () => {
        votes[0].reject();
        votes[1].reject();
      });

      expect(
        screen.getAllByRole('button', { name: '도움이 됐어요' }),
      ).toHaveLength(2);
      expect(
        screen.queryByText('의견 주셔서 감사해요'),
      ).not.toBeInTheDocument();
      expect(screen.getByText(FAIL_MESSAGE)).toBeInTheDocument();
    });

    it('카테고리를 바꿨다 돌아와도 투표한 FAQ는 투표 상태로 남아 다시 mutate할 수 없다', () => {
      const { votes, mutation } = createControlledMutation();
      setup({ mutation });
      voteOn(/로그인이 안 돼요/);

      fireEvent.click(chip(INQUIRY_CATEGORY_LABELS.bug_report));
      fireEvent.click(chip('전체'));
      openFaq(/로그인이 안 돼요/);

      expect(screen.getByText('의견 주셔서 감사해요')).toBeInTheDocument();
      const again = screen.queryByRole('button', { name: '도움이 됐어요' });
      if (again) fireEvent.click(again);
      expect(votes).toHaveLength(1);
    });

    it('검색했다 지워도(또는 검색 결과에서도) 투표 상태가 유지된다', () => {
      const { votes, mutation } = createControlledMutation();
      setup({ mutation, search: [FAQS[0]] });
      voteOn(/로그인이 안 돼요/);

      typeSearch('로그');
      openFaq(/로그인이 안 돼요/);
      expect(screen.getByText('의견 주셔서 감사해요')).toBeInTheDocument();

      typeSearch('');
      openFaq(/로그인이 안 돼요/);
      expect(screen.getByText('의견 주셔서 감사해요')).toBeInTheDocument();
      expect(votes).toHaveLength(1);
    });

    it('투표 후 포커스를 잃지 않고 완료 문구가 status/live 영역 안에 렌더된다', () => {
      const { mutation } = createControlledMutation();
      setup({ mutation });
      openFaq(/로그인이 안 돼요/);
      const button = screen.getByRole('button', { name: '도움이 됐어요' });
      button.focus();
      expect(document.activeElement).toBe(button);

      fireEvent.click(button);

      expect(document.activeElement).not.toBe(document.body);
      const done = screen.getByText('의견 주셔서 감사해요');
      expect(done.closest('[role="status"], [aria-live]')).not.toBeNull();
    });
  });

  describe('에러 문구', () => {
    it('연결 불안정 안내와 "다시 시도" 버튼을 보여준다', () => {
      setup({ faqs: { data: undefined, isError: true } });

      expect(
        screen.getByText('연결이 불안정해요. 잠시 후 다시 시도해주세요.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '다시 시도' }),
      ).toBeInTheDocument();
    });
  });
});
