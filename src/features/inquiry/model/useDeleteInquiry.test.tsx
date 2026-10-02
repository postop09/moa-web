import type { ReactNode } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteInquiry,
  deleteInquiryAttachments,
  getInquiryMessages,
} from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

import { useDeleteInquiry } from './useDeleteInquiry';

vi.mock('@/entities/inquiry', () => ({
  deleteInquiry: vi.fn(),
  deleteInquiryAttachments: vi.fn(),
  getInquiryMessages: vi.fn(),
}));

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

const LIST_KEY = [...inquiryQueryKeys.all, 'list'] as const;

const MESSAGES = [
  {
    id: 'm1',
    kind: 'question',
    attachments: ['u/inq-1/a.jpg', 'u/inq-1/b.jpg'],
  },
  { id: 'm2', kind: 'reply', attachments: ['u/inq-1/c.jpg'] },
  { id: 'm3', kind: 'question', attachments: [] },
];
const ALL_PATHS = ['u/inq-1/a.jpg', 'u/inq-1/b.jpg', 'u/inq-1/c.jpg'];

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

type Page = { items: { id: string }[]; nextPage: number | null };

const makeList = (): InfiniteData<Page> => ({
  pages: [
    { items: [{ id: 'inq-2' }, { id: 'inq-1' }], nextPage: 1 },
    { items: [{ id: 'inq-3' }], nextPage: null },
  ],
  pageParams: [0, 1],
});

const idsOf = (data: InfiniteData<Page> | undefined) =>
  data?.pages.flatMap((page) => page.items.map((item) => item.id));

const seed = (client: QueryClient, withMessages = true) => {
  client.setQueryData(LIST_KEY, makeList());
  client.setQueryData(inquiryQueryKeys.unreadCount(), 2);
  client.setQueryData(inquiryQueryKeys.detail('inq-1'), { id: 'inq-1' });
  if (withMessages) {
    client.setQueryData(inquiryQueryKeys.messages('inq-1'), MESSAGES);
  }
};

const isInvalidated = (client: QueryClient, key: readonly unknown[]) =>
  client.getQueryState(key)?.isInvalidated ?? false;

describe('useDeleteInquiry', () => {
  beforeEach(() => {
    vi.mocked(deleteInquiry).mockReset().mockResolvedValue(undefined);
    vi.mocked(deleteInquiryAttachments)
      .mockReset()
      .mockResolvedValue(undefined);
    vi.mocked(getInquiryMessages)
      .mockReset()
      .mockResolvedValue(MESSAGES as never);
  });

  it('캐시된 메시지의 첨부 경로(답변 포함)를 모아 DB 행을 먼저 지운 뒤 Storage 를 정리한다', async () => {
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useDeleteInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ inquiryId: 'inq-1' });
    });

    expect(getInquiryMessages).not.toHaveBeenCalled();
    expect(deleteInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-1');
    expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, ALL_PATHS);
    expect(vi.mocked(deleteInquiry).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(deleteInquiryAttachments).mock.invocationCallOrder[0],
    );
  });

  it('메시지 캐시가 없으면 삭제 전에 메시지를 조회해 경로를 확보한다', async () => {
    const client = createClient();
    seed(client, false);
    const { result } = renderHook(() => useDeleteInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ inquiryId: 'inq-1' });
    });

    expect(getInquiryMessages).toHaveBeenCalledWith(SUPABASE, 'inq-1');
    expect(
      vi.mocked(getInquiryMessages).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(deleteInquiry).mock.invocationCallOrder[0]);
    expect(deleteInquiryAttachments).toHaveBeenCalledWith(SUPABASE, ALL_PATHS);
  });

  it('Storage 정리가 실패해도 mutation 은 성공한다', async () => {
    vi.mocked(deleteInquiryAttachments).mockRejectedValue(new Error('storage'));
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useDeleteInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ inquiryId: 'inq-1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(isInvalidated(client, LIST_KEY)).toBe(true);
  });

  it('성공하면 목록/미확인 수를 무효화하고 삭제된 문의의 상세·메시지 캐시는 제거한다', async () => {
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useDeleteInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ inquiryId: 'inq-1' });
    });

    await waitFor(() => {
      expect(isInvalidated(client, LIST_KEY)).toBe(true);
      expect(isInvalidated(client, inquiryQueryKeys.unreadCount())).toBe(true);
    });
    expect(
      client.getQueryData(inquiryQueryKeys.detail('inq-1')),
    ).toBeUndefined();
    expect(
      client.getQueryData(inquiryQueryKeys.messages('inq-1')),
    ).toBeUndefined();
  });

  it('행 삭제가 실패하면 Storage 를 건드리지 않고 캐시도 그대로 둔다', async () => {
    const error = new Error('rls');
    vi.mocked(deleteInquiry).mockRejectedValue(error);
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useDeleteInquiry(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ inquiryId: 'inq-1' }),
      ).rejects.toBe(error);
    });

    expect(deleteInquiryAttachments).not.toHaveBeenCalled();
    expect(isInvalidated(client, LIST_KEY)).toBe(false);
    expect(client.getQueryData(inquiryQueryKeys.detail('inq-1'))).toEqual({
      id: 'inq-1',
    });
    expect(client.getQueryData(inquiryQueryKeys.messages('inq-1'))).toEqual(
      MESSAGES,
    );
  });

  describe('목록 캐시 반영', () => {
    it('성공하면 모든 목록 키의 페이지에서 해당 id 를 지운다', async () => {
      const client = createClient();
      seed(client);
      const waitingKey = inquiryQueryKeys.list('waiting');
      client.setQueryData(waitingKey, makeList());
      const { result } = renderHook(() => useDeleteInquiry(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({ inquiryId: 'inq-1' });
      });

      expect(idsOf(client.getQueryData(LIST_KEY))).toEqual(['inq-2', 'inq-3']);
      expect(idsOf(client.getQueryData(waitingKey))).toEqual([
        'inq-2',
        'inq-3',
      ]);
    });

    it('목록은 stale 로만 표시하고 바로 다시 조회하지 않는다', async () => {
      const client = createClient();
      seed(client);
      const queryFn = vi.fn(async () => makeList());
      const observer = new QueryObserver(client, {
        queryKey: LIST_KEY,
        queryFn,
        staleTime: Infinity,
      });
      const unsubscribe = observer.subscribe(() => {});
      const { result } = renderHook(() => useDeleteInquiry(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({ inquiryId: 'inq-1' });
      });
      await waitFor(() => expect(client.isFetching()).toBe(0));

      expect(isInvalidated(client, LIST_KEY)).toBe(true);
      expect(queryFn).not.toHaveBeenCalled();
      unsubscribe();
    });
  });

  describe('상세·메시지 캐시 제거는 구독자가 없을 때만', () => {
    const subscribeBoth = (client: QueryClient) => {
      const detail = new QueryObserver(client, {
        queryKey: inquiryQueryKeys.detail('inq-1'),
        queryFn: async () => ({ id: 'inq-1' }),
        staleTime: Infinity,
      });
      const messages = new QueryObserver(client, {
        queryKey: inquiryQueryKeys.messages('inq-1'),
        queryFn: async () => MESSAGES,
        staleTime: Infinity,
      });
      const stops = [detail.subscribe(() => {}), messages.subscribe(() => {})];

      return () => stops.forEach((stop) => stop());
    };

    it('구독자(마운트된 화면)가 있으면 삭제 직후에도 캐시를 지우지 않아 다시 조회가 일어나지 않는다', async () => {
      const client = createClient();
      seed(client);
      const unsubscribe = subscribeBoth(client);
      const { result } = renderHook(() => useDeleteInquiry(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({ inquiryId: 'inq-1' });
      });
      await waitFor(() => expect(client.isFetching()).toBe(0));

      expect(client.getQueryData(inquiryQueryKeys.detail('inq-1'))).toEqual({
        id: 'inq-1',
      });
      expect(client.getQueryData(inquiryQueryKeys.messages('inq-1'))).toEqual(
        MESSAGES,
      );
      unsubscribe();
    });

    it('구독자가 사라지면(언마운트) 그 뒤에 제거된다', async () => {
      const client = createClient();
      seed(client);
      const unsubscribe = subscribeBoth(client);
      const { result } = renderHook(() => useDeleteInquiry(), {
        wrapper: createWrapper(client),
      });
      await act(async () => {
        await result.current.mutateAsync({ inquiryId: 'inq-1' });
      });

      unsubscribe();

      await waitFor(() => {
        expect(
          client.getQueryData(inquiryQueryKeys.detail('inq-1')),
        ).toBeUndefined();
        expect(
          client.getQueryData(inquiryQueryKeys.messages('inq-1')),
        ).toBeUndefined();
      });
    });

    it('구독자가 없으면 바로 제거된다', async () => {
      const client = createClient();
      seed(client);
      const { result } = renderHook(() => useDeleteInquiry(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({ inquiryId: 'inq-1' });
      });

      expect(
        client.getQueryData(inquiryQueryKeys.detail('inq-1')),
      ).toBeUndefined();
      expect(
        client.getQueryData(inquiryQueryKeys.messages('inq-1')),
      ).toBeUndefined();
    });
  });
});
