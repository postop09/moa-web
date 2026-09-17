import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReplace, mockRemoveClient, mockSignOut } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockRemoveClient: vi.fn(),
  mockSignOut: vi.fn(async () => {}),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// createBrowserClient는 환경변수 기반 supabase 클라이언트를 만들므로 빈 객체로 대체한다.
vi.mock('@/shared/api', () => ({
  createBrowserClient: () => ({}),
}));

// signOut은 다른 슬라이스(entities/auth)이므로 공개 API(barrel)를 통해 mock한다.
vi.mock('@/entities/auth', () => ({
  signOut: mockSignOut,
}));

// getQueryPersister만 대체하고 나머지 shared/lib export는 원본을 유지한다.
vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getQueryPersister: () => ({
    removeClient: mockRemoveClient,
    persistClient: vi.fn(),
    restoreClient: vi.fn(),
  }),
}));

import { useSignOut } from './useSignOut';

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return Wrapper;
};

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const clearSpy = vi.spyOn(queryClient, 'clear');
  const { result } = renderHook(() => useSignOut(), {
    wrapper: createWrapper(queryClient),
  });

  return { result, clearSpy };
};

describe('useSignOut', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockRemoveClient.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
  });

  it('로그아웃 성공 시 영속화된 쿼리 캐시(localStorage)를 제거한다', async () => {
    const { result } = setup();

    await result.current.mutateAsync();

    expect(mockRemoveClient).toHaveBeenCalledTimes(1);
  });

  it('로그아웃 성공 시 메모리 쿼리 캐시를 비운다', async () => {
    const { result, clearSpy } = setup();

    await result.current.mutateAsync();

    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('로그아웃 성공 시 /login으로 replace 이동한다', async () => {
    const { result } = setup();

    await result.current.mutateAsync();

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('메모리 캐시를 비운 뒤 영속화 캐시를 제거하고, 마지막에 /login으로 이동한다', async () => {
    // clear()가 removeClient()보다 늦으면 persister가 빈 캐시를 다시 쓰기 전에 저장소를 비우는 순서가 깨진다.
    // 두 정리가 모두 끝난 뒤에 이동해야 다음 화면이 이전 계정 캐시를 보지 않는다.
    const { result, clearSpy } = setup();

    await result.current.mutateAsync();

    const clearOrder = clearSpy.mock.invocationCallOrder[0];
    const removeClientOrder = mockRemoveClient.mock.invocationCallOrder[0];
    const replaceOrder = mockReplace.mock.invocationCallOrder[0];

    expect(clearOrder).toBeLessThan(removeClientOrder);
    expect(removeClientOrder).toBeLessThan(replaceOrder);
  });

  it('로그아웃이 실패하면 캐시 제거·이동을 하지 않는다', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('로그아웃 실패'));
    const { result, clearSpy } = setup();

    await expect(result.current.mutateAsync()).rejects.toThrow('로그아웃 실패');

    expect(mockRemoveClient).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
