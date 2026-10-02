import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminInquiryMessages } from '@/entities/admin';

import { adminQueryKeys } from '../config/queryKeys';

import { useAdminInquiryMessages } from './useAdminInquiryMessages';

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getAdminInquiryMessages: vi.fn(),
}));

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe('useAdminInquiryMessages', () => {
  beforeEach(() => {
    vi.mocked(getAdminInquiryMessages).mockReset();
  });

  it('브라우저 supabase 와 id 로 메시지(메모 포함)를 조회한다', async () => {
    const rows = [
      { id: 'm1', kind: 'question' },
      { id: 'm2', kind: 'memo' },
    ];
    vi.mocked(getAdminInquiryMessages).mockResolvedValue(rows as never);

    const { result } = renderHook(() => useAdminInquiryMessages('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(rows));
    expect(getAdminInquiryMessages).toHaveBeenCalledWith(SUPABASE, 'inq-1');
  });

  it('adminQueryKeys.messages(id) 키로 캐시된다', async () => {
    vi.mocked(getAdminInquiryMessages).mockResolvedValue([] as never);
    const client = createClient();

    const { result } = renderHook(() => useAdminInquiryMessages('inq-1'), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryData(adminQueryKeys.messages('inq-1'))).toEqual([]);
  });

  it('실패하면 isError 이고 error 는 원본 그대로다', async () => {
    const error = new Error('boom');
    vi.mocked(getAdminInquiryMessages).mockRejectedValue(error);

    const { result } = renderHook(() => useAdminInquiryMessages('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });

  it('마운트할 때마다 다시 불러온다 (refetchOnMount "always" 옵저버 옵션)', async () => {
    vi.mocked(getAdminInquiryMessages).mockResolvedValue({
      id: 'inq-1',
    } as never);
    const client = createClient();

    const { result } = renderHook(() => useAdminInquiryMessages('inq-1'), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = client.getQueryCache().find({
      queryKey: adminQueryKeys.messages('inq-1'),
    });

    expect(query?.observers[0].options.refetchOnMount).toBe('always');
  });

  it('캐시가 아직 신선해도(staleTime 무한) 마운트하면 서버에서 다시 받는다', async () => {
    vi.mocked(getAdminInquiryMessages).mockResolvedValue({
      id: 'fresh',
    } as never);
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
    client.setQueryData(adminQueryKeys.messages('inq-1'), { id: 'cached' });

    const { result } = renderHook(() => useAdminInquiryMessages('inq-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() =>
      expect(getAdminInquiryMessages).toHaveBeenCalledTimes(1),
    );
    await waitFor(() => expect(result.current.data).toEqual({ id: 'fresh' }));
  });
});
