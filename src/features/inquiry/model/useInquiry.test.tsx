import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getInquiry } from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

import { useInquiry } from './useInquiry';

vi.mock('@/entities/inquiry', () => ({
  getInquiry: vi.fn(),
}));

const SUPABASE = { __supabase: true };

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => SUPABASE),
}));

const INQUIRY = { id: 'inq-1', title: '제목', status: 'waiting' };

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const createWrapper = (client: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('useInquiry', () => {
  beforeEach(() => {
    vi.mocked(getInquiry).mockReset();
  });

  it('id 로 문의를 조회해 data 로 돌려준다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(INQUIRY as never);

    const { result } = renderHook(() => useInquiry('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(INQUIRY));
    expect(getInquiry).toHaveBeenCalledWith(SUPABASE, 'inq-1');
  });

  it('문의가 없으면(null) data 는 null 이다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(null);

    const { result } = renderHook(() => useInquiry('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('조회가 실패하면 isError 가 된다', async () => {
    vi.mocked(getInquiry).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useInquiry('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('inquiryQueryKeys.detail(id) 캐시 키를 쓴다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(INQUIRY as never);
    const client = createClient();

    const { result } = renderHook(() => useInquiry('inq-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.data).toEqual(INQUIRY));
    expect(client.getQueryData(inquiryQueryKeys.detail('inq-1'))).toEqual(
      INQUIRY,
    );
  });

  it('id 가 바뀌면 새 id 로 다시 조회한다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(INQUIRY as never);

    const { rerender } = renderHook(({ id }) => useInquiry(id), {
      wrapper: createWrapper(createClient()),
      initialProps: { id: 'inq-1' },
    });
    await waitFor(() => expect(getInquiry).toHaveBeenCalledTimes(1));

    rerender({ id: 'inq-2' });

    await waitFor(() =>
      expect(getInquiry).toHaveBeenLastCalledWith(SUPABASE, 'inq-2'),
    );
  });

  it('retry 옵션을 주지 않으면 클라이언트 기본값(retry:false)을 따라 한 번만 시도한다', async () => {
    vi.mocked(getInquiry).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useInquiry('inq-1'), {
      wrapper: createWrapper(createClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getInquiry).toHaveBeenCalledTimes(1);
  });

  it('{ retry: 1 } 이면 실패한 조회를 정확히 두 번 시도한다', async () => {
    vi.mocked(getInquiry).mockRejectedValue(new Error('boom'));
    const client = new QueryClient({
      defaultOptions: { queries: { retryDelay: 0 } },
    });

    const { result } = renderHook(() => useInquiry('inq-1', { retry: 1 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getInquiry).toHaveBeenCalledTimes(2);
  });

  it('{ retry: 1 } 이어도 첫 시도가 성공하면 재시도하지 않는다', async () => {
    vi.mocked(getInquiry).mockResolvedValue(INQUIRY as never);
    const client = new QueryClient({
      defaultOptions: { queries: { retryDelay: 0 } },
    });

    const { result } = renderHook(() => useInquiry('inq-1', { retry: 1 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.data).toEqual(INQUIRY));
    expect(getInquiry).toHaveBeenCalledTimes(1);
  });
});
