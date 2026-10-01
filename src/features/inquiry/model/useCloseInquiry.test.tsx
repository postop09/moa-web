import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { closeInquiry } from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

import { useCloseInquiry } from './useCloseInquiry';

vi.mock('@/entities/inquiry', () => ({
  closeInquiry: vi.fn(),
}));

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

const LIST_KEY = [...inquiryQueryKeys.all, 'list'] as const;

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

const seed = (client: QueryClient) => {
  client.setQueryData(LIST_KEY, ['list']);
  client.setQueryData(inquiryQueryKeys.unreadCount(), 2);
  client.setQueryData(inquiryQueryKeys.detail('inq-1'), { id: 'inq-1' });
  client.setQueryData(inquiryQueryKeys.messages('inq-1'), []);
};

const isInvalidated = (client: QueryClient, key: readonly unknown[]) =>
  client.getQueryState(key)?.isInvalidated ?? false;

describe('useCloseInquiry', () => {
  beforeEach(() => {
    vi.mocked(closeInquiry).mockReset();
  });

  it('mutate({ inquiryId }) 가 supabase 클라이언트와 id 로 closeInquiry 를 호출한다', async () => {
    vi.mocked(closeInquiry).mockResolvedValue(undefined);
    const { result } = renderHook(() => useCloseInquiry(), {
      wrapper: createWrapper(createClient()),
    });

    await act(async () => {
      await result.current.mutateAsync({ inquiryId: 'inq-1' });
    });

    expect(closeInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-1');
  });

  it('성공하면 목록/미확인 수/상세/메시지 캐시를 무효화한다', async () => {
    vi.mocked(closeInquiry).mockResolvedValue(undefined);
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useCloseInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ inquiryId: 'inq-1' });
    });

    await waitFor(() => {
      expect(isInvalidated(client, LIST_KEY)).toBe(true);
      expect(isInvalidated(client, inquiryQueryKeys.unreadCount())).toBe(true);
      expect(isInvalidated(client, inquiryQueryKeys.detail('inq-1'))).toBe(
        true,
      );
      expect(isInvalidated(client, inquiryQueryKeys.messages('inq-1'))).toBe(
        true,
      );
    });
  });

  it('실패해도(settle) 에러를 그대로 전달하고 목록/상세 캐시를 무효화한다', async () => {
    const error = new Error('rpc');
    vi.mocked(closeInquiry).mockRejectedValue(error);
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useCloseInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ inquiryId: 'inq-1' }),
      ).rejects.toBe(error);
    });

    await waitFor(() => {
      expect(isInvalidated(client, LIST_KEY)).toBe(true);
      expect(isInvalidated(client, inquiryQueryKeys.detail('inq-1'))).toBe(
        true,
      );
    });
  });
});
