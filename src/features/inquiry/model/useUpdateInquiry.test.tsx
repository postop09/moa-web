import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateInquiry } from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

import { useUpdateInquiry } from './useUpdateInquiry';

vi.mock('@/entities/inquiry', () => ({
  updateInquiry: vi.fn(),
}));

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

const REQ = {
  inquiryId: 'inq-1',
  title: '수정된 제목',
  body: '수정된 본문 열 글자 이상',
};
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

describe('useUpdateInquiry', () => {
  beforeEach(() => {
    vi.mocked(updateInquiry).mockReset();
  });

  it('요청을 entities 함수에 supabase 클라이언트와 함께 넘기고 결과를 돌려준다', async () => {
    vi.mocked(updateInquiry).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useUpdateInquiry(), {
      wrapper: createWrapper(createClient()),
    });

    let value: unknown;
    await act(async () => {
      value = await result.current.mutateAsync(REQ);
    });

    expect(updateInquiry).toHaveBeenCalledWith(SUPABASE, REQ);
    expect(value).toEqual(undefined);
  });

  it('성공하면 목록/미확인 수/상세/메시지 캐시를 무효화한다', async () => {
    vi.mocked(updateInquiry).mockResolvedValue(undefined as never);
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useUpdateInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync(REQ);
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

  it('실패하면 에러를 그대로 전달하고 캐시를 무효화하지 않는다', async () => {
    const error = new Error('rpc');
    vi.mocked(updateInquiry).mockRejectedValue(error);
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useUpdateInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(REQ)).rejects.toBe(error);
    });

    expect(isInvalidated(client, LIST_KEY)).toBe(false);
    expect(isInvalidated(client, inquiryQueryKeys.unreadCount())).toBe(false);
    expect(isInvalidated(client, inquiryQueryKeys.detail('inq-1'))).toBe(false);
    expect(isInvalidated(client, inquiryQueryKeys.messages('inq-1'))).toBe(
      false,
    );
  });
});
