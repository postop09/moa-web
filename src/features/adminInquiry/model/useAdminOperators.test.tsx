import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminList } from '@/entities/admin';

import { adminQueryKeys } from '../config/queryKeys';

import { useAdminOperators } from './useAdminOperators';

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getAdminList: vi.fn(),
}));

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const FIVE_MINUTES = 5 * 60 * 1000;

describe('useAdminOperators', () => {
  beforeEach(() => {
    vi.mocked(getAdminList).mockReset();
  });

  it('브라우저 supabase 로 운영자 목록을 조회한다', async () => {
    const rows = [{ userId: 'op-1', email: 'opa@moa.test' }];
    vi.mocked(getAdminList).mockResolvedValue(rows);

    const { result } = renderHook(() => useAdminOperators(), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(rows));
    expect(getAdminList).toHaveBeenCalledWith(SUPABASE);
  });

  it('adminQueryKeys.operators() 키로 캐시되고 staleTime 이 길다 (거의 바뀌지 않는 목록)', async () => {
    vi.mocked(getAdminList).mockResolvedValue([]);
    const client = createClient();

    const { result } = renderHook(() => useAdminOperators(), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = client
      .getQueryCache()
      .find({ queryKey: adminQueryKeys.operators() });

    expect(query).toBeDefined();
    expect(query?.observers[0].options.staleTime).toBeGreaterThanOrEqual(
      FIVE_MINUTES,
    );
  });

  it('다시 마운트해도 staleTime 안에서는 다시 조회하지 않는다', async () => {
    vi.mocked(getAdminList).mockResolvedValue([]);
    const client = createClient();

    const first = renderHook(() => useAdminOperators(), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const second = renderHook(() => useAdminOperators(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(getAdminList).toHaveBeenCalledTimes(1);
  });

  it('실패하면 isError', async () => {
    vi.mocked(getAdminList).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useAdminOperators(), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
