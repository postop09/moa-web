import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminUserRecentInquiries } from '@/entities/admin';

import { adminQueryKeys } from '../config/queryKeys';

import { useAdminRecentInquiries } from './useAdminRecentInquiries';

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getAdminUserRecentInquiries: vi.fn(),
}));

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe('useAdminRecentInquiries', () => {
  beforeEach(() => {
    vi.mocked(getAdminUserRecentInquiries).mockReset();
  });

  it('브라우저 supabase 와 문의 id 로 같은 사용자의 이전 문의를 조회한다', async () => {
    const rows = [
      {
        id: 'a',
        title: '이전',
        status: 'closed',
        category: null,
        createdAt: '2026-08-13T15:00:00Z',
      },
    ];
    vi.mocked(getAdminUserRecentInquiries).mockResolvedValue(rows as never);

    const { result } = renderHook(() => useAdminRecentInquiries('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(rows));
    expect(getAdminUserRecentInquiries).toHaveBeenCalledWith(
      SUPABASE,
      expect.objectContaining({ inquiryId: 'inq-1' }),
    );
  });

  it('adminQueryKeys.recent(id) 키로 캐시된다', async () => {
    vi.mocked(getAdminUserRecentInquiries).mockResolvedValue([]);
    const client = createClient();

    const { result } = renderHook(() => useAdminRecentInquiries('inq-1'), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryData(adminQueryKeys.recent('inq-1'))).toEqual([]);
  });

  it('실패하면 isError', async () => {
    vi.mocked(getAdminUserRecentInquiries).mockRejectedValue(new Error('x'));

    const { result } = renderHook(() => useAdminRecentInquiries('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
