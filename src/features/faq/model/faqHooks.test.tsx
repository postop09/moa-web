import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getFaqs, searchFaqs } from '@/entities/faq';

import { useFaqs } from './useFaqs';
import { useSearchFaqs } from './useSearchFaqs';

vi.mock('@/entities/faq', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/faq')>()),
  getFaqs: vi.fn(),
  searchFaqs: vi.fn(),
}));

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => ({ __supabase: true })),
}));

const FAQ = {
  id: 'f1',
  category: 'bug_report',
  question: '오류가 나요',
  answer: '새로고침해 보세요',
  helpfulCount: 3,
  sortOrder: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

beforeEach(() => {
  vi.mocked(getFaqs).mockReset().mockResolvedValue([FAQ]);
  vi.mocked(searchFaqs).mockReset().mockResolvedValue([FAQ]);
});

describe('useFaqs', () => {
  it('카테고리를 넘기면 해당 카테고리로 조회한다', async () => {
    const { result } = renderHook(() => useFaqs('bug_report'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual([FAQ]));
    expect(getFaqs).toHaveBeenCalledWith(expect.anything(), 'bug_report');
  });

  it('카테고리를 생략하면(전체) category 없이 조회한다', async () => {
    const { result } = renderHook(() => useFaqs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual([FAQ]));
    expect(vi.mocked(getFaqs).mock.calls[0][1]).toBeUndefined();
  });

  it('카테고리가 바뀌면 다시 조회한다', async () => {
    const { result, rerender } = renderHook(
      ({ category }: { category?: string }) => useFaqs(category),
      { wrapper: createWrapper(), initialProps: { category: 'other' } },
    );
    await waitFor(() => expect(result.current.data).toBeDefined());

    rerender({ category: 'bug_report' });

    await waitFor(() =>
      expect(getFaqs).toHaveBeenCalledWith(expect.anything(), 'bug_report'),
    );
  });

  it('조회 실패 시 isError가 true가 된다', async () => {
    vi.mocked(getFaqs).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useFaqs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useFaqs 이전 데이터 유지', () => {
  it('카테고리 전환 중에도 새 데이터가 오기 전까지 이전 데이터를 유지한다', async () => {
    const { result, rerender } = renderHook(
      ({ category }: { category?: string }) => useFaqs(category),
      { wrapper: createWrapper(), initialProps: { category: 'other' } },
    );
    await waitFor(() => expect(result.current.data).toEqual([FAQ]));

    let resolveNext!: (value: (typeof FAQ)[]) => void;
    vi.mocked(getFaqs).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNext = resolve;
      }) as never,
    );
    rerender({ category: 'bug_report' });

    await waitFor(() =>
      expect(getFaqs).toHaveBeenCalledWith(expect.anything(), 'bug_report'),
    );
    expect(result.current.data).toEqual([FAQ]);
    expect(result.current.isLoading).toBe(false);

    const next = { ...FAQ, id: 'f2' };
    await act(async () => {
      resolveNext([next]);
    });
    await waitFor(() => expect(result.current.data).toEqual([next]));
  });
});

describe('useSearchFaqs 디바운스 상태와 이전 데이터 유지', () => {
  it('입력 직후 isDebouncing이 true이고, 디바운스가 끝나면 false와 debouncedKeyword(trim)를 반환한다', async () => {
    const { result } = renderHook(() => useSearchFaqs('  로그인 '), {
      wrapper: createWrapper(),
    });

    expect(result.current.isDebouncing).toBe(true);

    await waitFor(() => expect(result.current.isDebouncing).toBe(false), {
      timeout: 2000,
    });
    expect(result.current.debouncedKeyword).toBe('로그인');
  });

  it('키워드가 바뀌어도 새 결과 전까지 이전 검색 결과를 유지한다', async () => {
    const { result, rerender } = renderHook(
      ({ keyword }: { keyword: string }) => useSearchFaqs(keyword),
      { wrapper: createWrapper(), initialProps: { keyword: '로그' } },
    );
    await waitFor(() => expect(result.current.data).toEqual([FAQ]), {
      timeout: 2000,
    });

    let resolveNext!: (value: (typeof FAQ)[]) => void;
    vi.mocked(searchFaqs).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNext = resolve;
      }) as never,
    );
    rerender({ keyword: '로그인' });

    // 디바운스 대기 중: 이전 데이터 유지 + isDebouncing
    expect(result.current.isDebouncing).toBe(true);
    expect(result.current.data).toEqual([FAQ]);

    // 디바운스 종료 후 조회 중에도 이전 데이터 유지
    await waitFor(
      () =>
        expect(searchFaqs).toHaveBeenLastCalledWith(
          expect.anything(),
          '로그인',
        ),
      { timeout: 2000 },
    );
    expect(result.current.isDebouncing).toBe(false);
    expect(result.current.data).toEqual([FAQ]);
    expect(result.current.isLoading).toBe(false);

    const next = { ...FAQ, id: 'f9' };
    await act(async () => {
      resolveNext([next]);
    });
    await waitFor(() => expect(result.current.data).toEqual([next]));
  });
});

describe('useSearchFaqs', () => {
  it.each(['', ' ', 'a', ' a ', '  '])(
    'trim 후 2자 미만(%j)이면 검색하지 않는다',
    async (keyword) => {
      renderHook(() => useSearchFaqs(keyword), { wrapper: createWrapper() });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 450));
      });

      expect(searchFaqs).not.toHaveBeenCalled();
    },
  );

  it('2자 이상이면 약 300ms 디바운스 후 trim된 키워드로 검색한다', async () => {
    const { result } = renderHook(() => useSearchFaqs('  로그인 '), {
      wrapper: createWrapper(),
    });

    expect(searchFaqs).not.toHaveBeenCalled();

    await waitFor(() => expect(result.current.data).toEqual([FAQ]), {
      timeout: 2000,
    });
    expect(searchFaqs).toHaveBeenCalledTimes(1);
    expect(searchFaqs).toHaveBeenCalledWith(expect.anything(), '로그인');
  });

  it('빠르게 입력이 바뀌면 마지막 키워드로만 검색한다', async () => {
    const { rerender } = renderHook(
      ({ keyword }: { keyword: string }) => useSearchFaqs(keyword),
      { wrapper: createWrapper(), initialProps: { keyword: '로그' } },
    );

    rerender({ keyword: '로그인' });

    await waitFor(() => expect(searchFaqs).toHaveBeenCalled(), {
      timeout: 2000,
    });
    expect(searchFaqs).toHaveBeenCalledTimes(1);
    expect(searchFaqs).toHaveBeenCalledWith(expect.anything(), '로그인');
  });
});
