import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockClearCurrentHouseholdId } = vi.hoisted(() => ({
  mockClearCurrentHouseholdId: vi.fn(),
}));

// clearCurrentHouseholdId는 다른 슬라이스(features/household)이므로 공개 API(barrel)를 통해 mock한다.
vi.mock('@/features/household', () => ({
  clearCurrentHouseholdId: mockClearCurrentHouseholdId,
}));

import { ResetClientState } from './ResetClientState';

// 영속화 캐시 키는 shared/config의 QUERY_PERSIST_KEY와 같아야 한다. 실제 persister(jsdom localStorage)를
// 그대로 써서 removeClient가 이 키를 지우는지 통합적으로 확인한다.
const PERSIST_KEY = 'moa:query-cache';
const HOUSEHOLDS_KEY = ['households', 'list'];

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(HOUSEHOLDS_KEY, [
    { id: 'h1', name: '이전 계정 집' },
  ]);
  localStorage.setItem(PERSIST_KEY, '{}');

  const view = render(
    <QueryClientProvider client={queryClient}>
      <ResetClientState />
    </QueryClientProvider>,
  );

  return { queryClient, ...view };
};

describe('ResetClientState', () => {
  beforeEach(() => {
    localStorage.clear();
    mockClearCurrentHouseholdId.mockReset();
  });

  it('아무것도 렌더하지 않는다', () => {
    const { container } = setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('마운트 시 메모리 쿼리 캐시를 모두 비운다', () => {
    const { queryClient } = setup();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getQueryData(HOUSEHOLDS_KEY)).toBeUndefined();
  });

  it('마운트 시 localStorage에 영속화된 쿼리 캐시를 제거한다', () => {
    setup();

    expect(localStorage.getItem(PERSIST_KEY)).toBeNull();
  });

  it('마운트 시 현재 가구 선택(currentHouseholdId)을 초기화한다', () => {
    setup();

    expect(mockClearCurrentHouseholdId).toHaveBeenCalledTimes(1);
  });
});
