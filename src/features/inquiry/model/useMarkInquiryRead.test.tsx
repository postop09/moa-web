import type { ReactNode } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { markInquiryRead } from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

import { useMarkInquiryRead } from './useMarkInquiryRead';

vi.mock('@/entities/inquiry', () => ({
  markInquiryRead: vi.fn(),
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

type Item = { id: string; hasUnreadReply: boolean };
type Page = { items: Item[]; nextPage: number | null };

const makeList = (): InfiniteData<Page> => ({
  pages: [
    {
      items: [
        { id: 'inq-2', hasUnreadReply: true },
        { id: 'inq-1', hasUnreadReply: true },
      ],
      nextPage: 1,
    },
    { items: [{ id: 'inq-3', hasUnreadReply: true }], nextPage: null },
  ],
  pageParams: [0, 1],
});

const flagsOf = (data: InfiniteData<Page> | undefined) =>
  Object.fromEntries(
    (data?.pages ?? []).flatMap((page) =>
      page.items.map((item) => [item.id, item.hasUnreadReply]),
    ),
  );

const seed = (client: QueryClient) => {
  client.setQueryData(LIST_KEY, makeList());
  client.setQueryData(inquiryQueryKeys.unreadCount(), 2);
  client.setQueryData(inquiryQueryKeys.detail('inq-1'), { id: 'inq-1' });
  client.setQueryData(inquiryQueryKeys.messages('inq-1'), []);
};

const isInvalidated = (client: QueryClient, key: readonly unknown[]) =>
  client.getQueryState(key)?.isInvalidated ?? false;

describe('useMarkInquiryRead', () => {
  beforeEach(() => {
    vi.mocked(markInquiryRead).mockReset();
  });

  it('mutate({ inquiryId }) 가 supabase 클라이언트와 id 로 markInquiryRead 를 호출한다', async () => {
    vi.mocked(markInquiryRead).mockResolvedValue(undefined);
    const { result } = renderHook(() => useMarkInquiryRead(), {
      wrapper: createWrapper(createClient()),
    });

    await act(async () => {
      await result.current.mutateAsync({ inquiryId: 'inq-1' });
    });

    expect(markInquiryRead).toHaveBeenCalledWith(SUPABASE, 'inq-1');
  });

  it('성공하면 미확인 수/목록/상세 캐시를 무효화한다', async () => {
    vi.mocked(markInquiryRead).mockResolvedValue(undefined);
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useMarkInquiryRead(), {
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
    });
  });

  it('실패하면 에러를 그대로 전달하고 캐시를 무효화하지 않는다', async () => {
    const error = new Error('rpc');
    vi.mocked(markInquiryRead).mockRejectedValue(error);
    const client = createClient();
    seed(client);
    const { result } = renderHook(() => useMarkInquiryRead(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ inquiryId: 'inq-1' }),
      ).rejects.toBe(error);
    });

    expect(isInvalidated(client, LIST_KEY)).toBe(false);
    expect(isInvalidated(client, inquiryQueryKeys.detail('inq-1'))).toBe(false);
  });

  describe('목록 캐시 반영', () => {
    const observe = (
      client: QueryClient,
      key: readonly unknown[],
      data: unknown,
    ) => {
      const queryFn = vi.fn(async () => data);
      const observer = new QueryObserver(client, {
        queryKey: key,
        queryFn,
        staleTime: Infinity,
      });
      const unsubscribe = observer.subscribe(() => {});

      return { queryFn, unsubscribe };
    };

    it('성공하면 캐시된 모든 목록 페이지에서 해당 문의의 hasUnreadReply 만 false 로 바꾼다', async () => {
      vi.mocked(markInquiryRead).mockResolvedValue(undefined);
      const client = createClient();
      seed(client);
      const waitingKey = inquiryQueryKeys.list('waiting');
      client.setQueryData(waitingKey, makeList());
      const { result } = renderHook(() => useMarkInquiryRead(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({ inquiryId: 'inq-1' });
      });

      const expected = { 'inq-2': true, 'inq-1': false, 'inq-3': true };
      expect(flagsOf(client.getQueryData(LIST_KEY))).toEqual(expected);
      expect(flagsOf(client.getQueryData(waitingKey))).toEqual(expected);
      // 페이지 구조(순서)는 그대로다.
      expect(
        client
          .getQueryData<InfiniteData<Page>>(LIST_KEY)
          ?.pages.map((page) => page.items.map((item) => item.id)),
      ).toEqual([['inq-2', 'inq-1'], ['inq-3']]);
    });

    it('목록은 stale 로만 표시하고 바로 다시 조회하지 않아 카드 순서가 흔들리지 않는다', async () => {
      vi.mocked(markInquiryRead).mockResolvedValue(undefined);
      const client = createClient();
      seed(client);
      const list = observe(client, LIST_KEY, makeList());
      const { result } = renderHook(() => useMarkInquiryRead(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({ inquiryId: 'inq-1' });
      });
      await waitFor(() => expect(client.isFetching()).toBe(0));

      expect(isInvalidated(client, LIST_KEY)).toBe(true);
      expect(list.queryFn).not.toHaveBeenCalled();
      list.unsubscribe();
    });

    it('미확인 수는 바로 다시 조회한다', async () => {
      vi.mocked(markInquiryRead).mockResolvedValue(undefined);
      const client = createClient();
      seed(client);
      const count = observe(client, inquiryQueryKeys.unreadCount(), 1);
      const { result } = renderHook(() => useMarkInquiryRead(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({ inquiryId: 'inq-1' });
      });

      await waitFor(() => expect(count.queryFn).toHaveBeenCalledTimes(1));
      count.unsubscribe();
    });

    it('실패하면 목록 캐시의 값을 바꾸지 않는다', async () => {
      vi.mocked(markInquiryRead).mockRejectedValue(new Error('rpc'));
      const client = createClient();
      seed(client);
      const { result } = renderHook(() => useMarkInquiryRead(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await expect(
          result.current.mutateAsync({ inquiryId: 'inq-1' }),
        ).rejects.toThrow('rpc');
      });

      expect(flagsOf(client.getQueryData(LIST_KEY))).toEqual({
        'inq-2': true,
        'inq-1': true,
        'inq-3': true,
      });
    });
  });
});
