import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedUser } from '@/entities/auth';
import { getMyInquiries } from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

import { useMyInquiries } from './useMyInquiries';

vi.mock('@/entities/auth', () => ({
  getCachedUser: vi.fn(),
}));

vi.mock('@/entities/inquiry', () => ({
  getMyInquiries: vi.fn(),
}));

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

const makeItem = (id: string) => ({ id, title: `제목 ${id}` });

const createClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('useMyInquiries', () => {
  beforeEach(() => {
    vi.mocked(getCachedUser).mockReset();
    vi.mocked(getMyInquiries).mockReset();
    vi.mocked(getCachedUser).mockResolvedValue({ id: 'user-1' } as never);
  });

  it('현재 사용자 id, 0페이지, 상태 필터로 첫 페이지를 조회한다', async () => {
    vi.mocked(getMyInquiries).mockResolvedValue({
      items: [makeItem('a')],
      nextPage: null,
    } as never);

    const { result } = renderHook(() => useMyInquiries('waiting'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getMyInquiries).toHaveBeenCalledWith(SUPABASE, {
      userId: 'user-1',
      page: 0,
      status: 'waiting',
    });
    expect(result.current.data?.pages[0].items).toEqual([makeItem('a')]);
  });

  it('응답의 nextPage 가 있으면 hasNextPage, null 이면 아니다', async () => {
    vi.mocked(getMyInquiries).mockResolvedValue({
      items: [makeItem('a')],
      nextPage: 1,
    } as never);

    const { result } = renderHook(() => useMyInquiries('all'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
  });

  it('fetchNextPage 는 응답이 알려준 nextPage 번호로 다음 페이지를 조회한다', async () => {
    vi.mocked(getMyInquiries)
      .mockResolvedValueOnce({ items: [makeItem('a')], nextPage: 1 } as never)
      .mockResolvedValueOnce({
        items: [makeItem('b')],
        nextPage: null,
      } as never);

    const { result } = renderHook(() => useMyInquiries('all'), {
      wrapper: createWrapper(createClient()),
    });
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(getMyInquiries).toHaveBeenLastCalledWith(SUPABASE, {
      userId: 'user-1',
      page: 1,
      status: 'all',
    });
    expect(result.current.data?.pages[1].items).toEqual([makeItem('b')]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('상태가 바뀌면 별도 캐시 키로 다시 조회하고, 둘 다 목록 키 아래에 놓인다', async () => {
    vi.mocked(getMyInquiries).mockImplementation((async (
      _supabase: unknown,
      { status }: { status: string },
    ) => ({
      items: [makeItem(status)],
      nextPage: null,
    })) as never);
    const client = createClient();

    const { result, rerender } = renderHook(
      ({ status }: { status: 'all' | 'answered' }) => useMyInquiries(status),
      { wrapper: createWrapper(client), initialProps: { status: 'all' } },
    );
    await waitFor(() =>
      expect(result.current.data?.pages[0].items).toEqual([makeItem('all')]),
    );

    rerender({ status: 'answered' });

    await waitFor(() =>
      expect(result.current.data?.pages[0].items).toEqual([
        makeItem('answered'),
      ]),
    );
    expect(
      client.getQueryCache().findAll({ queryKey: inquiryQueryKeys.list() }),
    ).toHaveLength(2);
  });

  it('로그인 사용자가 없으면 조회하지 않고 빈 결과를 돌려준다', async () => {
    vi.mocked(getCachedUser).mockResolvedValue(null as never);

    const { result } = renderHook(() => useMyInquiries('all'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getMyInquiries).not.toHaveBeenCalled();
    expect(result.current.data?.pages.flatMap((p) => p.items)).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('조회가 실패하면 isError 가 된다', async () => {
    vi.mocked(getMyInquiries).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useMyInquiries('all'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
