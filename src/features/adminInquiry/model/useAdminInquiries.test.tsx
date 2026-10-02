import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminInquiries, parseAdminInquiryFilters } from '@/entities/admin';

import { adminQueryKeys } from '../config/queryKeys';

import { useAdminInquiries } from './useAdminInquiries';

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getAdminInquiries: vi.fn(),
}));

const filtersOf = (query: Record<string, string> = {}) =>
  parseAdminInquiryFilters(query);

const result = (id: string, total = 1) => ({
  items: [{ id, title: `제목 ${id}` }],
  total,
});

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe('useAdminInquiries', () => {
  beforeEach(() => {
    vi.mocked(getAdminInquiries).mockReset();
  });

  it('브라우저 supabase 와 필터로 목록을 조회하고 { items, total } 을 돌려준다', async () => {
    vi.mocked(getAdminInquiries).mockResolvedValue(result('a', 45) as never);
    const filters = filtersOf({ category: 'bug_report', page: '2' });

    const { result: hook } = renderHook(() => useAdminInquiries(filters), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(hook.current.data).toBeDefined());
    expect(getAdminInquiries).toHaveBeenCalledWith(SUPABASE, filters);
    expect(hook.current.data).toEqual(result('a', 45));
  });

  it('필터 어느 한 항목만 바뀌어도 별도 캐시 키로 다시 조회한다', async () => {
    vi.mocked(getAdminInquiries).mockImplementation((async (
      _supabase: unknown,
      { page }: { page: number },
    ) => result(`p${page}`)) as never);
    const client = createClient();

    const { result: hook, rerender } = renderHook(
      ({ page }: { page: string }) => useAdminInquiries(filtersOf({ page })),
      { wrapper: createWrapper(client), initialProps: { page: '1' } },
    );
    await waitFor(() => expect(hook.current.data?.items[0].id).toBe('p1'));

    rerender({ page: '2' });

    await waitFor(() => expect(hook.current.data?.items[0].id).toBe('p2'));
    expect(getAdminInquiries).toHaveBeenCalledTimes(2);
    expect(
      client.getQueryCache().findAll({
        queryKey: adminQueryKeys.inquiries(filtersOf({ page: '1' })),
      }),
    ).toHaveLength(1);
  });

  it('같은 내용의 필터는 새 객체여도 같은 캐시를 쓴다', async () => {
    vi.mocked(getAdminInquiries).mockResolvedValue(result('a') as never);
    const client = createClient();

    const { result: hook, rerender } = renderHook(
      () => useAdminInquiries(filtersOf({ page: '2' })),
      { wrapper: createWrapper(client) },
    );
    await waitFor(() => expect(hook.current.data).toBeDefined());

    rerender();

    expect(getAdminInquiries).toHaveBeenCalledTimes(1);
  });

  it('필터가 바뀌어 새로 불러오는 동안 이전 결과를 유지한다 (깜빡임 없음)', async () => {
    let resolveSecond: (value: unknown) => void = () => {};
    vi.mocked(getAdminInquiries)
      .mockResolvedValueOnce(result('first') as never)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }) as never,
      );

    const { result: hook, rerender } = renderHook(
      ({ page }: { page: string }) => useAdminInquiries(filtersOf({ page })),
      {
        wrapper: createWrapper(createClient()),
        initialProps: { page: '1' },
      },
    );
    await waitFor(() => expect(hook.current.data?.items[0].id).toBe('first'));

    rerender({ page: '2' });

    await waitFor(() => expect(hook.current.isFetching).toBe(true));
    expect(hook.current.data?.items[0].id).toBe('first');
    expect(hook.current.isPlaceholderData).toBe(true);

    resolveSecond(result('second'));

    await waitFor(() => expect(hook.current.data?.items[0].id).toBe('second'));
    expect(hook.current.isPlaceholderData).toBe(false);
  });

  it('최초 조회 중에는 data 가 없고 isPending 이다', async () => {
    vi.mocked(getAdminInquiries).mockReturnValue(
      new Promise(() => {}) as never,
    );

    const { result: hook } = renderHook(() => useAdminInquiries(filtersOf()), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(hook.current.isFetching).toBe(true));
    expect(hook.current.data).toBeUndefined();
    expect(hook.current.isPending).toBe(true);
  });

  it('조회가 실패하면 isError 이고 error 는 원본 그대로다', async () => {
    const error = new Error('boom');
    vi.mocked(getAdminInquiries).mockRejectedValue(error);

    const { result: hook } = renderHook(() => useAdminInquiries(filtersOf()), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(hook.current.isError).toBe(true));
    expect(hook.current.error).toBe(error);
  });
});
