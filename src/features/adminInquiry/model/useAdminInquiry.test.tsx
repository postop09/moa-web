import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminInquiry } from '@/entities/admin';

import { adminQueryKeys } from '../config/queryKeys';

import { useAdminInquiry } from './useAdminInquiry';

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getAdminInquiry: vi.fn(),
}));

const createClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe('useAdminInquiry', () => {
  beforeEach(() => {
    vi.mocked(getAdminInquiry).mockReset();
  });

  it('브라우저 supabase 와 id 로 문의를 조회해 행을 그대로 돌려준다', async () => {
    const row = { id: 'inq-1', title: '제목' };
    vi.mocked(getAdminInquiry).mockResolvedValue(row as never);

    const { result } = renderHook(() => useAdminInquiry('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(row));
    expect(getAdminInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-1');
  });

  it('adminQueryKeys.inquiry(id) 키로 캐시된다', async () => {
    vi.mocked(getAdminInquiry).mockResolvedValue({ id: 'inq-1' } as never);
    const client = createClient();

    const { result } = renderHook(() => useAdminInquiry('inq-1'), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(client.getQueryData(adminQueryKeys.inquiry('inq-1'))).toEqual({
      id: 'inq-1',
    });
    expect(adminQueryKeys.inquiry('inq-1')).not.toEqual(
      adminQueryKeys.inquiry('inq-2'),
    );
  });

  it('문의마다 키가 달라 다른 id 는 따로 조회한다', async () => {
    vi.mocked(getAdminInquiry).mockImplementation((async (
      _supabase: unknown,
      id: string,
    ) => ({ id })) as never);

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useAdminInquiry(id),
      { wrapper: createWrapper(createClient()), initialProps: { id: 'a' } },
    );
    await waitFor(() => expect(result.current.data?.id).toBe('a'));

    rerender({ id: 'b' });

    await waitFor(() => expect(result.current.data?.id).toBe('b'));
  });

  it('실패하면 한 번 더 시도한 뒤(retry 1) isError 가 되고 error 는 원본 그대로다', async () => {
    const error = new Error('boom');
    vi.mocked(getAdminInquiry).mockRejectedValue(error);

    const { result } = renderHook(() => useAdminInquiry('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
    expect(getAdminInquiry).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  }, 10_000);

  it('not_found 는 null 로 삼키지 않고 error 로 노출한다 (data 는 undefined)', async () => {
    const error = { code: 'P0001', message: 'not_found' };
    vi.mocked(getAdminInquiry).mockRejectedValue(error);

    const { result } = renderHook(() => useAdminInquiry('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  }, 10_000);

  it('마운트할 때마다 다시 불러온다 (refetchOnMount "always" 옵저버 옵션)', async () => {
    vi.mocked(getAdminInquiry).mockResolvedValue({ id: 'inq-1' } as never);
    const client = createClient();

    const { result } = renderHook(() => useAdminInquiry('inq-1'), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = client.getQueryCache().find({
      queryKey: adminQueryKeys.inquiry('inq-1'),
    });

    expect(query?.observers[0].options.refetchOnMount).toBe('always');
  });

  it('캐시가 아직 신선해도(staleTime 무한) 마운트하면 서버에서 다시 받는다', async () => {
    vi.mocked(getAdminInquiry).mockResolvedValue({ id: 'fresh' } as never);
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
    client.setQueryData(adminQueryKeys.inquiry('inq-1'), { id: 'cached' });

    const { result } = renderHook(() => useAdminInquiry('inq-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(getAdminInquiry).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.data).toEqual({ id: 'fresh' }));
  });
});
