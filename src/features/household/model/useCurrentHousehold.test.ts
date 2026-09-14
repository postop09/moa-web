import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { transactionQueryKeys } from '@/features/transaction/config/queryKeys';
import { scheduleQueryKeys } from '@/features/schedule/config/queryKeys';
import { householdMemberQueryKeys } from '@/features/householdMember/config/queryKeys';

import { householdQueryKeys } from '../config/queryKeys';

type FakeQuery = { queryKey: unknown[] };
type Predicate = (query: FakeQuery) => boolean;

const { storeState, mockUseListHouseholds } = vi.hoisted(() => ({
  storeState: {
    householdId: null as string | null,
    hydrated: true,
    hydrate: vi.fn(),
    setHouseholdId: vi.fn(),
    clearHouseholdId: vi.fn(),
  },
  mockUseListHouseholds: vi.fn(),
}));

// currentHouseholdStore, useListHouseholds는 같은 슬라이스(features/household) 내부이므로
// 상대 경로로 mock한다.
vi.mock('./currentHouseholdStore', () => ({
  useCurrentHouseholdStore: (selector: (state: typeof storeState) => unknown) =>
    selector(storeState),
}));

vi.mock('./useListHouseholds', () => ({
  useListHouseholds: () => mockUseListHouseholds(),
}));

import { useCurrentHousehold } from './useCurrentHousehold';

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return Wrapper;
};

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const { result } = renderHook(() => useCurrentHousehold(), {
    wrapper: createWrapper(queryClient),
  });

  return { result, invalidateSpy };
};

const getPredicate = (
  invalidateSpy: ReturnType<typeof vi.spyOn>,
): Predicate => {
  const lastCall = invalidateSpy.mock.calls.at(-1)?.[0] as
    { predicate?: Predicate } | undefined;

  if (!lastCall?.predicate) {
    throw new Error(
      'invalidateQueries가 predicate 옵션과 함께 호출되지 않았다',
    );
  }

  return lastCall.predicate;
};

describe('useCurrentHousehold - setHouseholdId invalidate predicate', () => {
  beforeEach(() => {
    storeState.householdId = null;
    storeState.hydrated = true;
    storeState.hydrate.mockReset();
    storeState.setHouseholdId.mockReset();
    storeState.clearHouseholdId.mockReset();

    mockUseListHouseholds.mockReset();
    mockUseListHouseholds.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      error: null,
    });
  });

  it('setHouseholdId 호출 시 predicate 옵션과 함께 invalidateQueries를 호출한다', () => {
    const { result, invalidateSpy } = setup();

    act(() => {
      result.current.setHouseholdId('new-household-id');
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(typeof getPredicate(invalidateSpy)).toBe('function');
  });

  it('transaction의 목록 키(marker: list)이고 세 번째 요소가 새 id와 일치하면 무효화 대상이다', () => {
    const newId = 'new-household-id';
    const { result, invalidateSpy } = setup();

    act(() => {
      result.current.setHouseholdId(newId);
    });

    const predicate = getPredicate(invalidateSpy);
    const queryKey = transactionQueryKeys.lists(newId);

    expect(predicate({ queryKey: [...queryKey] })).toBe(true);
  });

  it('schedule의 목록 키(marker: list)이고 세 번째 요소가 새 id와 일치하면 무효화 대상이다', () => {
    const newId = 'new-household-id';
    const { result, invalidateSpy } = setup();

    act(() => {
      result.current.setHouseholdId(newId);
    });

    const predicate = getPredicate(invalidateSpy);
    const queryKey = scheduleQueryKeys.lists(newId);

    expect(predicate({ queryKey: [...queryKey] })).toBe(true);
  });

  it('household-member의 invites 키이고 세 번째 요소가 새 id와 일치하면 무효화 대상이다', () => {
    const newId = 'new-household-id';
    const { result, invalidateSpy } = setup();

    act(() => {
      result.current.setHouseholdId(newId);
    });

    const predicate = getPredicate(invalidateSpy);
    const queryKey = householdMemberQueryKeys.invites(newId);

    expect(predicate({ queryKey: [...queryKey] })).toBe(true);
  });

  it('household 자기 자신의 목록 키(householdQueryKeys.list())는 제외한다', () => {
    const newId = 'new-household-id';
    const { result, invalidateSpy } = setup();

    act(() => {
      result.current.setHouseholdId(newId);
    });

    const predicate = getPredicate(invalidateSpy);
    const queryKey = householdQueryKeys.list();

    expect(predicate({ queryKey: [...queryKey] })).toBe(false);
  });

  it('id가 top-level이 아니라 배열 안에 중첩되어 있으면 무효화 대상이 아니다', () => {
    // profiles 도메인에는 실제 queryKey 팩토리가 없다. id가 배열 등 중첩된
    // 구조에 들어 있을 때 predicate가 얕은 3번째 요소 비교만 하는지 확인하는
    // 용도로 만든 예시 키다.
    const newId = 'new-household-id';
    const { result, invalidateSpy } = setup();

    act(() => {
      result.current.setHouseholdId(newId);
    });

    const predicate = getPredicate(invalidateSpy);

    expect(predicate({ queryKey: ['profiles', 'byIds', [newId]] })).toBe(false);
  });

  it('다른 household id를 가진 쿼리키는 무효화 대상이 아니다', () => {
    const newId = 'new-household-id';
    const otherId = '다른-household-id';
    const { result, invalidateSpy } = setup();

    act(() => {
      result.current.setHouseholdId(newId);
    });

    const predicate = getPredicate(invalidateSpy);
    const queryKey = transactionQueryKeys.lists(otherId);

    expect(predicate({ queryKey: [...queryKey] })).toBe(false);
  });

  it('두 번째 요소가 list/invites 중 하나가 아니면 id가 포함돼도 무효화하지 않는다', () => {
    // 실제로는 households 도메인에 'byId' 팩토리가 없지만, predicate가 두 번째
    // 요소로 'list'/'invites' 마커만 허용하는지 확인하는 용도의 예시 키다.
    const newId = 'new-household-id';
    const { result, invalidateSpy } = setup();

    act(() => {
      result.current.setHouseholdId(newId);
    });

    const predicate = getPredicate(invalidateSpy);

    expect(predicate({ queryKey: ['households', 'byId', newId] })).toBe(false);
  });
});
