import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminPendingCount } from '@/entities/admin';

import { adminQueryKeys } from '../config/queryKeys';

import { useAdminPendingCount } from './useAdminPendingCount';

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getAdminPendingCount: vi.fn(),
}));

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe('useAdminPendingCount', () => {
  beforeEach(() => {
    vi.mocked(getAdminPendingCount).mockReset();
  });

  it('브라우저 supabase 로 미처리 건수를 조회한다', async () => {
    vi.mocked(getAdminPendingCount).mockResolvedValue(12);

    const { result } = renderHook(() => useAdminPendingCount(), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toBe(12));
    expect(getAdminPendingCount).toHaveBeenCalledWith(SUPABASE);
  });

  it('adminQueryKeys.pendingCount() 키로 캐시되고 60초마다 다시 조회하도록 등록된다', async () => {
    vi.mocked(getAdminPendingCount).mockResolvedValue(3);
    const client = createClient();

    const { result } = renderHook(() => useAdminPendingCount(), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(result.current.data).toBe(3));

    const query = client
      .getQueryCache()
      .find({ queryKey: adminQueryKeys.pendingCount() });

    expect(query).toBeDefined();
    expect(query?.observers[0].options.refetchInterval).toBe(60_000);
  });

  it('조회가 실패하면 isError (배지는 숨겨지고 화면은 계속 쓸 수 있다)', async () => {
    vi.mocked(getAdminPendingCount).mockRejectedValue(new Error('x'));

    const { result } = renderHook(() => useAdminPendingCount(), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
