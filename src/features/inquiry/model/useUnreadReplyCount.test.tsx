import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedUser } from '@/entities/auth';
import { getUnreadReplyCount } from '@/entities/inquiry';

import { useUnreadReplyCount } from './useUnreadReplyCount';

vi.mock('@/entities/auth', () => ({
  getCachedUser: vi.fn(),
}));

vi.mock('@/entities/inquiry', () => ({
  getUnreadReplyCount: vi.fn(),
}));

vi.mock('@/shared/api', () => ({
  createBrowserClient: vi.fn(() => ({ __supabase: true })),
}));

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('useUnreadReplyCount', () => {
  beforeEach(() => {
    vi.mocked(getCachedUser).mockReset();
    vi.mocked(getUnreadReplyCount).mockReset();
  });

  it('현재 사용자 id로 미확인 답변 수를 조회해 data로 돌려준다', async () => {
    vi.mocked(getCachedUser).mockResolvedValue({ id: 'user-1' } as never);
    vi.mocked(getUnreadReplyCount).mockResolvedValue(3);

    const { result } = renderHook(() => useUnreadReplyCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBe(3));
    expect(getUnreadReplyCount).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
    );
  });

  it('미확인 답변이 없으면 0을 돌려준다', async () => {
    vi.mocked(getCachedUser).mockResolvedValue({ id: 'user-1' } as never);
    vi.mocked(getUnreadReplyCount).mockResolvedValue(0);

    const { result } = renderHook(() => useUnreadReplyCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBe(0));
  });

  it('로그인 사용자가 없으면 조회하지 않고 0을 돌려준다', async () => {
    vi.mocked(getCachedUser).mockResolvedValue(null as never);

    const { result } = renderHook(() => useUnreadReplyCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBe(0));
    expect(getUnreadReplyCount).not.toHaveBeenCalled();
  });
});
