import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCreateHousehold,
  mockGetCachedUser,
  mockCreateBrowserClient,
  mockSetCurrentHouseholdId,
} = vi.hoisted(() => ({
  mockCreateHousehold: vi.fn(),
  mockGetCachedUser: vi.fn(),
  mockCreateBrowserClient: vi.fn(),
  mockSetCurrentHouseholdId: vi.fn(),
}));

vi.mock('@/entities/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));

vi.mock('@/entities/auth', () => ({
  getCachedUser: (...args: unknown[]) => mockGetCachedUser(...args),
}));

vi.mock('@/shared/api', () => ({
  createBrowserClient: () => mockCreateBrowserClient(),
}));

// setCurrentHouseholdId는 같은 슬라이스(features/household) 내부이므로 상대 경로로 mock한다.
vi.mock('./currentHouseholdStore', () => ({
  setCurrentHouseholdId: (...args: unknown[]) =>
    mockSetCurrentHouseholdId(...args),
}));

import { householdQueryKeys } from '../config/queryKeys';
import { useCreateHousehold } from './useCreateHousehold';

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return Wrapper;
};

describe('useCreateHousehold', () => {
  beforeEach(() => {
    mockCreateHousehold.mockReset();
    mockGetCachedUser.mockReset();
    mockCreateBrowserClient.mockReset();
    mockSetCurrentHouseholdId.mockReset();

    mockGetCachedUser.mockResolvedValue({ id: 'user-1' });
    mockCreateBrowserClient.mockReturnValue({});
  });

  it('성공 시 새 household를 목록 캐시에 setQueryData로 직접 반영한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const newHousehold = { id: 'household-1', name: '우리집' };
    mockCreateHousehold.mockResolvedValue(newHousehold);

    const { result } = renderHook(() => useCreateHousehold(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('우리집');
    });

    expect(queryClient.getQueryData(householdQueryKeys.list())).toEqual([
      newHousehold,
    ]);
    expect(mockSetCurrentHouseholdId).toHaveBeenCalledWith('household-1');
  });

  it('이미 캐시에 같은 id의 household가 있으면 중복 추가하지 않는다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const existing = { id: 'household-1', name: '우리집' };
    queryClient.setQueryData(householdQueryKeys.list(), [existing]);
    mockCreateHousehold.mockResolvedValue(existing);

    const { result } = renderHook(() => useCreateHousehold(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('우리집');
    });

    expect(queryClient.getQueryData(householdQueryKeys.list())).toEqual([
      existing,
    ]);
  });

  it('성공 시 캐시를 직접 갱신했으므로 invalidateQueries는 호출하지 않는다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const newHousehold = { id: 'household-1', name: '우리집' };
    mockCreateHousehold.mockResolvedValue(newHousehold);

    const { result } = renderHook(() => useCreateHousehold(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('우리집');
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('로그인한 사용자가 없으면 mutation이 실패하고 캐시를 건드리지 않는다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockGetCachedUser.mockResolvedValue(null);

    const { result } = renderHook(() => useCreateHousehold(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync('우리집')).rejects.toThrow(
        '로그인이 필요합니다.',
      );
    });

    expect(mockCreateHousehold).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(householdQueryKeys.list())).toBeUndefined();
  });
});
