import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getInquiryMessages } from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

import { useInquiryMessages } from './useInquiryMessages';

vi.mock('@/entities/inquiry', () => ({
  getInquiryMessages: vi.fn(),
}));

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

const MESSAGES = [
  {
    id: 'm1',
    inquiryId: 'inq-1',
    kind: 'question',
    body: '질문입니다 열 글자 이상',
    attachments: [],
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('useInquiryMessages', () => {
  beforeEach(() => {
    vi.mocked(getInquiryMessages).mockReset();
  });

  it('id 로 메시지 목록을 조회해 data 로 돌려준다', async () => {
    vi.mocked(getInquiryMessages).mockResolvedValue(MESSAGES as never);

    const { result } = renderHook(() => useInquiryMessages('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(MESSAGES));
    expect(getInquiryMessages).toHaveBeenCalledWith(SUPABASE, 'inq-1');
  });

  it('조회가 실패하면 isError 가 된다', async () => {
    vi.mocked(getInquiryMessages).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useInquiryMessages('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('inquiryQueryKeys.messages(id) 캐시 키를 쓴다', async () => {
    vi.mocked(getInquiryMessages).mockResolvedValue(MESSAGES as never);
    const client = createClient();

    const { result } = renderHook(() => useInquiryMessages('inq-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.data).toEqual(MESSAGES));
    expect(client.getQueryData(inquiryQueryKeys.messages('inq-1'))).toEqual(
      MESSAGES,
    );
  });

  it('refetch 는 다시 조회한다', async () => {
    vi.mocked(getInquiryMessages).mockResolvedValue(MESSAGES as never);
    const { result } = renderHook(() => useInquiryMessages('inq-1'), {
      wrapper: createWrapper(createClient()),
    });
    await waitFor(() => expect(result.current.data).toEqual(MESSAGES));

    await result.current.refetch();

    expect(getInquiryMessages).toHaveBeenCalledTimes(2);
  });
});
