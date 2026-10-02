import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAttachmentUrls } from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

import { useAttachmentUrls } from './useAttachmentUrls';

vi.mock('@/entities/inquiry', () => ({
  getAttachmentUrls: vi.fn(),
}));

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

const createClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const signed = (paths: string[]) =>
  paths.map((path) => ({ path, url: `https://signed/${path}` }));

describe('useAttachmentUrls', () => {
  beforeEach(() => {
    vi.mocked(getAttachmentUrls).mockReset();
    vi.mocked(getAttachmentUrls).mockImplementation((async (
      _supabase: unknown,
      paths: string[],
    ) => signed(paths)) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('경로 순서대로 서명 URL 결과를 돌려준다', async () => {
    const { result } = renderHook(() => useAttachmentUrls(['b.jpg', 'a.jpg']), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getAttachmentUrls).toHaveBeenCalledWith(SUPABASE, [
      'b.jpg',
      'a.jpg',
    ]);
    expect(result.current.data).toEqual(signed(['b.jpg', 'a.jpg']));
  });

  it('서명에 실패한 경로의 url 은 null 로 그대로 전달한다', async () => {
    vi.mocked(getAttachmentUrls).mockResolvedValue([
      { path: 'a.jpg', url: null },
    ]);
    const { result } = renderHook(() => useAttachmentUrls(['a.jpg']), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() =>
      expect(result.current.data).toEqual([{ path: 'a.jpg', url: null }]),
    );
  });

  it('경로가 비어 있으면 조회하지 않는다', async () => {
    const { result } = renderHook(() => useAttachmentUrls([]), {
      wrapper: createWrapper(createClient()),
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getAttachmentUrls).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('경로가 바뀌면 새 경로로 다시 서명한다', async () => {
    const { result, rerender } = renderHook(
      ({ paths }: { paths: string[] }) => useAttachmentUrls(paths),
      {
        wrapper: createWrapper(createClient()),
        initialProps: { paths: ['a'] },
      },
    );
    await waitFor(() => expect(result.current.data).toEqual(signed(['a'])));

    rerender({ paths: ['a', 'b'] });

    await waitFor(() =>
      expect(result.current.data).toEqual(signed(['a', 'b'])),
    );
  });

  it('캐시 보관 시간(gcTime)은 서명 URL 수명(1시간)보다 짧고 staleTime 보다 길다', async () => {
    const client = createClient();
    const { result } = renderHook(() => useAttachmentUrls(['a.jpg']), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());

    const query = client.getQueryCache().findAll({
      queryKey: inquiryQueryKeys.attachmentUrls(['a.jpg']),
    })[0];
    const { gcTime, staleTime } = query.options as {
      gcTime?: number;
      staleTime?: number;
    };

    expect(typeof gcTime).toBe('number');
    expect(typeof staleTime).toBe('number');
    expect(gcTime as number).toBeLessThanOrEqual(50 * 60 * 1000);
    expect(gcTime as number).toBeGreaterThan(staleTime as number);
  });

  it('서명 URL 수명(1시간)보다 짧은 시간 뒤에 다시 마운트하면 다시 서명하고, 직후에는 캐시를 쓴다', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const client = createClient();
    const wrapper = createWrapper(client);

    const first = renderHook(() => useAttachmentUrls(['a.jpg']), { wrapper });
    await waitFor(() => expect(first.result.current.data).toBeDefined());
    first.unmount();

    const second = renderHook(() => useAttachmentUrls(['a.jpg']), { wrapper });
    await waitFor(() => expect(second.result.current.data).toBeDefined());
    expect(getAttachmentUrls).toHaveBeenCalledTimes(1);
    second.unmount();

    vi.setSystemTime(Date.now() + 50 * 60 * 1000);
    const third = renderHook(() => useAttachmentUrls(['a.jpg']), { wrapper });

    await waitFor(() => expect(getAttachmentUrls).toHaveBeenCalledTimes(2));
    third.unmount();
  });

  describe('서명 URL 만료 (서명 후 60분)', () => {
    const MIN = 60 * 1000;
    const signedV = (paths: string[], version: string) =>
      paths.map((path) => ({ path, url: `https://signed/${version}/${path}` }));

    const createDeferred = <T,>() => {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    };

    it('55분보다 오래된 캐시는 다시 마운트해도 쓸 수 없는 값(data undefined)으로 보고 즉시 다시 서명하며, 끝나면 새 URL 을 돌려준다', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const client = createClient();
      const wrapper = createWrapper(client);
      vi.mocked(getAttachmentUrls).mockResolvedValueOnce(
        signedV(['a.jpg'], 'old'),
      );

      const first = renderHook(() => useAttachmentUrls(['a.jpg']), {
        wrapper,
      });
      await waitFor(() => expect(first.result.current.data).toBeDefined());
      first.unmount();

      // gcTime 타이머는 실제 시간이라 캐시는 남아 있고 Date 만 56분 흐른다.
      vi.setSystemTime(Date.now() + 56 * MIN);
      const fresh = createDeferred<ReturnType<typeof signedV>>();
      vi.mocked(getAttachmentUrls).mockReturnValueOnce(fresh.promise as never);

      const second = renderHook(() => useAttachmentUrls(['a.jpg']), {
        wrapper,
      });

      expect(second.result.current.data).toBeUndefined();
      await waitFor(() => expect(getAttachmentUrls).toHaveBeenCalledTimes(2));
      expect(getAttachmentUrls).toHaveBeenLastCalledWith(SUPABASE, ['a.jpg']);
      expect(second.result.current.data).toBeUndefined();

      fresh.resolve(signedV(['a.jpg'], 'new'));

      await waitFor(() =>
        expect(second.result.current.data).toEqual(signedV(['a.jpg'], 'new')),
      );
      second.unmount();
    });

    it('55분보다 어린 캐시는 다시 마운트하면 즉시 돌려준다 (staleTime 재조회는 그대로)', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const client = createClient();
      const wrapper = createWrapper(client);
      vi.mocked(getAttachmentUrls).mockResolvedValueOnce(
        signedV(['a.jpg'], 'old'),
      );

      const first = renderHook(() => useAttachmentUrls(['a.jpg']), {
        wrapper,
      });
      await waitFor(() => expect(first.result.current.data).toBeDefined());
      first.unmount();

      vi.setSystemTime(Date.now() + 40 * MIN);
      const fresh = createDeferred<ReturnType<typeof signedV>>();
      vi.mocked(getAttachmentUrls).mockReturnValueOnce(fresh.promise as never);

      const second = renderHook(() => useAttachmentUrls(['a.jpg']), {
        wrapper,
      });

      expect(second.result.current.data).toEqual(signedV(['a.jpg'], 'old'));
      await waitFor(() => expect(getAttachmentUrls).toHaveBeenCalledTimes(2));

      fresh.resolve(signedV(['a.jpg'], 'new'));
      await waitFor(() =>
        expect(second.result.current.data).toEqual(signedV(['a.jpg'], 'new')),
      );
      second.unmount();
    });

    describe('마운트된 동안 자동 재서명', () => {
      it('갱신 주기(staleTime 30분 이하)가 지나면 같은 경로로 다시 서명하고 새 URL 을 돌려준다', async () => {
        vi.useFakeTimers();
        vi.mocked(getAttachmentUrls)
          .mockResolvedValueOnce(signedV(['a.jpg'], 'v1'))
          .mockResolvedValueOnce(signedV(['a.jpg'], 'v2'));
        const { result, unmount } = renderHook(
          () => useAttachmentUrls(['a.jpg']),
          { wrapper: createWrapper(createClient()) },
        );

        await vi.advanceTimersByTimeAsync(0);
        expect(result.current.data).toEqual(signedV(['a.jpg'], 'v1'));
        expect(getAttachmentUrls).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(30 * MIN);

        expect(getAttachmentUrls).toHaveBeenCalledTimes(2);
        expect(getAttachmentUrls).toHaveBeenLastCalledWith(SUPABASE, ['a.jpg']);
        expect(result.current.data).toEqual(signedV(['a.jpg'], 'v2'));
        unmount();
      });

      it('경로가 비어 있으면 시간이 지나도 아무것도 예약하지 않는다', async () => {
        vi.useFakeTimers();
        const { unmount } = renderHook(() => useAttachmentUrls([]), {
          wrapper: createWrapper(createClient()),
        });

        await vi.advanceTimersByTimeAsync(2 * 60 * MIN);

        expect(getAttachmentUrls).not.toHaveBeenCalled();
        unmount();
      });
    });
  });
});
