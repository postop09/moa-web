import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addAdminMemo,
  closeAdminInquiry,
  getAdminInquiries,
  getAdminInquiry,
  getAdminInquiryMessages,
  openAdminInquiry,
  parseAdminInquiryFilters,
  replyAdminInquiry,
  updateAdminInquiryMeta,
} from '@/entities/admin';

import { adminQueryKeys } from '../config/queryKeys';

import { useAddAdminMemo } from './useAddAdminMemo';
import { useAdminInquiries } from './useAdminInquiries';
import { useAdminInquiry } from './useAdminInquiry';
import { useAdminInquiryMessages } from './useAdminInquiryMessages';
import { useCloseAdminInquiry } from './useCloseAdminInquiry';
import { useOpenAdminInquiry } from './useOpenAdminInquiry';
import { useReplyAdminInquiry } from './useReplyAdminInquiry';
import { useUpdateAdminInquiryMeta } from './useUpdateAdminInquiryMeta';

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

vi.mock('@/entities/admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  addAdminMemo: vi.fn(),
  closeAdminInquiry: vi.fn(),
  getAdminInquiries: vi.fn(),
  getAdminInquiry: vi.fn(),
  getAdminInquiryMessages: vi.fn(),
  openAdminInquiry: vi.fn(),
  replyAdminInquiry: vi.fn(),
  updateAdminInquiryMeta: vi.fn(),
}));

const FILTERS = parseAdminInquiryFilters({});
const REPLY_PAYLOAD = {
  inquiryId: 'inq-1',
  body: '답변',
  attachments: ['user-1/f/a.jpg'],
  expectedLastMessageId: 'm1',
  expectedUpdatedAt: '2026-10-01T05:20:00Z',
};

// 각 변경 요청은 성공하든 실패하든 같은 캐시를 다시 맞춰야 한다.
const CASES = [
  {
    name: 'useOpenAdminInquiry',
    useHook: useOpenAdminInquiry,
    entity: openAdminInquiry,
    variables: { inquiryId: 'inq-1' },
    entityArgs: [SUPABASE, 'inq-1'],
    result: undefined,
  },
  {
    name: 'useReplyAdminInquiry',
    useHook: useReplyAdminInquiry,
    entity: replyAdminInquiry,
    variables: REPLY_PAYLOAD,
    entityArgs: [SUPABASE, REPLY_PAYLOAD],
    result: 'new-message-id',
  },
  {
    name: 'useAddAdminMemo',
    useHook: useAddAdminMemo,
    entity: addAdminMemo,
    variables: { inquiryId: 'inq-1', body: '메모' },
    entityArgs: [SUPABASE, { inquiryId: 'inq-1', body: '메모' }],
    result: 'memo-id',
  },
  {
    name: 'useUpdateAdminInquiryMeta',
    useHook: useUpdateAdminInquiryMeta,
    entity: updateAdminInquiryMeta,
    variables: { inquiryId: 'inq-1', status: 'waiting' as const },
    entityArgs: [SUPABASE, { inquiryId: 'inq-1', status: 'waiting' }],
    result: undefined,
  },
  {
    name: 'useCloseAdminInquiry',
    useHook: useCloseAdminInquiry,
    entity: closeAdminInquiry,
    variables: { inquiryId: 'inq-1', reason: '중복 문의' },
    entityArgs: [SUPABASE, { inquiryId: 'inq-1', reason: '중복 문의' }],
    result: undefined,
  },
] as const;

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
  client.setQueryData(adminQueryKeys.inquiry('inq-1'), { id: 'inq-1' });
  client.setQueryData(adminQueryKeys.messages('inq-1'), []);
  client.setQueryData(adminQueryKeys.recent('inq-1'), []);
  client.setQueryData(adminQueryKeys.pendingCount(), 3);
  client.setQueryData(adminQueryKeys.inquiries(FILTERS), {
    items: [],
    total: 0,
  });
};

const isInvalidated = (client: QueryClient, key: readonly unknown[]) =>
  client.getQueryState(key)?.isInvalidated ?? false;

const expectAllInvalidated = (client: QueryClient) => {
  expect(isInvalidated(client, adminQueryKeys.inquiry('inq-1'))).toBe(true);
  expect(isInvalidated(client, adminQueryKeys.messages('inq-1'))).toBe(true);
  expect(isInvalidated(client, adminQueryKeys.recent('inq-1'))).toBe(true);
  expect(isInvalidated(client, adminQueryKeys.pendingCount())).toBe(true);
  expect(isInvalidated(client, adminQueryKeys.inquiries(FILTERS))).toBe(true);
};

describe('어드민 문의 변경 훅', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminInquiries).mockResolvedValue({ items: [], total: 0 });
  });

  describe.each(CASES)('$name', (testCase) => {
    const { useHook, entity, variables, entityArgs, result } = testCase;
    const mockedEntity = vi.mocked(entity as (...args: unknown[]) => unknown);

    it('mutate 하면 브라우저 supabase 와 변수로 entities 함수를 호출한다', async () => {
      mockedEntity.mockResolvedValue(result);
      const { result: hook } = renderHook(() => useHook(), {
        wrapper: createWrapper(createClient()),
      });

      await act(async () => {
        await hook.current.mutateAsync(variables as never);
      });

      expect(mockedEntity).toHaveBeenCalledTimes(1);
      expect(mockedEntity).toHaveBeenCalledWith(...entityArgs);
    });

    it('성공하면 mutateAsync 가 entities 의 결과를 돌려준다', async () => {
      mockedEntity.mockResolvedValue(result);
      const { result: hook } = renderHook(() => useHook(), {
        wrapper: createWrapper(createClient()),
      });

      let value: unknown;
      await act(async () => {
        value = await hook.current.mutateAsync(variables as never);
      });

      expect(value).toBe(result);
    });

    it('성공하면 상세/메시지/이전 문의/미처리 수/목록 캐시를 모두 무효화한다', async () => {
      mockedEntity.mockResolvedValue(result);
      const client = createClient();
      seed(client);
      const { result: hook } = renderHook(() => useHook(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await hook.current.mutateAsync(variables as never);
      });

      await waitFor(() => expectAllInvalidated(client));
    });

    it('실패해도(충돌 포함) 같은 캐시를 무효화하고, 오류는 원본 그대로 호출부에 던진다', async () => {
      const error = { code: 'P0001', message: 'conflict' };
      mockedEntity.mockRejectedValue(error);
      const client = createClient();
      seed(client);
      const { result: hook } = renderHook(() => useHook(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await expect(hook.current.mutateAsync(variables as never)).rejects.toBe(
          error,
        );
      });

      await waitFor(() => expectAllInvalidated(client));
    });

    it('화면에 떠 있는(active) 목록 조회는 끝난 뒤 다시 불러온다', async () => {
      mockedEntity.mockResolvedValue(result);
      const client = createClient();
      const { result: hook } = renderHook(
        () => ({ mutation: useHook(), list: useAdminInquiries(FILTERS) }),
        { wrapper: createWrapper(client) },
      );
      await waitFor(() => expect(hook.current.list.isSuccess).toBe(true));
      expect(getAdminInquiries).toHaveBeenCalledTimes(1);

      await act(async () => {
        await hook.current.mutation.mutateAsync(variables as never);
      });

      await waitFor(() => expect(getAdminInquiries).toHaveBeenCalledTimes(2));
    });

    it('화면에 떠 있는 상세/메시지 조회도 실패 뒤에 다시 불러온다 (충돌이면 최신 상태를 보여줘야 한다)', async () => {
      mockedEntity.mockRejectedValue({ code: 'P0001', message: 'conflict' });
      vi.mocked(getAdminInquiry).mockResolvedValue({ id: 'inq-1' } as never);
      vi.mocked(getAdminInquiryMessages).mockResolvedValue([] as never);
      const client = createClient();
      const { result: hook } = renderHook(
        () => ({
          mutation: useHook(),
          detail: useAdminInquiry('inq-1'),
          messages: useAdminInquiryMessages('inq-1'),
        }),
        { wrapper: createWrapper(client) },
      );
      await waitFor(() => {
        expect(hook.current.detail.isSuccess).toBe(true);
        expect(hook.current.messages.isSuccess).toBe(true);
      });

      await act(async () => {
        await hook.current.mutation
          .mutateAsync(variables as never)
          .catch(() => undefined);
      });

      await waitFor(() => {
        expect(getAdminInquiry).toHaveBeenCalledTimes(2);
        expect(getAdminInquiryMessages).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('답변 등록 후 기대값 갱신', () => {
    it('끝난 뒤 상세를 다시 불러와 다음 답변이 새 updatedAt 을 기대값으로 쓸 수 있다', async () => {
      vi.mocked(replyAdminInquiry).mockResolvedValue('new-message-id');
      vi.mocked(getAdminInquiry)
        .mockResolvedValueOnce({
          id: 'inq-1',
          updatedAt: '2026-10-01T05:20:00Z',
        } as never)
        .mockResolvedValue({
          id: 'inq-1',
          updatedAt: '2026-10-01T06:00:00Z',
        } as never);
      vi.mocked(getAdminInquiryMessages).mockResolvedValue([] as never);
      const { result: hook } = renderHook(
        () => ({
          mutation: useReplyAdminInquiry(),
          detail: useAdminInquiry('inq-1'),
        }),
        { wrapper: createWrapper(createClient()) },
      );
      await waitFor(() =>
        expect(hook.current.detail.data?.updatedAt).toBe(
          '2026-10-01T05:20:00Z',
        ),
      );

      await act(async () => {
        await hook.current.mutation.mutateAsync(REPLY_PAYLOAD);
      });

      await waitFor(() =>
        expect(hook.current.detail.data?.updatedAt).toBe(
          '2026-10-01T06:00:00Z',
        ),
      );
    });
  });
});
