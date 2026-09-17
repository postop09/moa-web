import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseListTransactions, mockUseListCategories } = vi.hoisted(() => ({
  mockUseListTransactions: vi.fn(),
  mockUseListCategories: vi.fn(),
}));

// 다른 슬라이스(features/transaction, features/category)이므로 공개 API(barrel)를 통해
// 훅만 대체하고, 대시보드 집계에 쓰이는 순수 유틸(buildXxx, getMonthRange 등)은 원본을 유지한다.
vi.mock('@/features/transaction', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useListTransactions: () => mockUseListTransactions(),
}));

vi.mock('@/features/category', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useListCategories: () => mockUseListCategories(),
}));

import { useHomeDashboard } from './useHomeDashboard';

const SELECTED_MONTH = new Date(2026, 8, 1);

const renderDashboard = (householdId: string | null = 'h1') =>
  renderHook(() => useHomeDashboard(householdId, SELECTED_MONTH));

type QueryStateOverrides = {
  data?: unknown;
  isPending?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
  refetch?: ReturnType<typeof vi.fn>;
};

// useQuery 결과 중 useHomeDashboard가 읽는 필드만 갖는 mock 반환값을 만든다.
const makeQueryState = (overrides: QueryStateOverrides = {}) => ({
  data: undefined,
  isPending: false,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(async () => ({})),
  ...overrides,
});

const TRANSACTIONS_DATA = { data: [], count: 0 };
const CATEGORIES_DATA: unknown[] = [];

describe('useHomeDashboard - 로딩/갱신 상태', () => {
  beforeEach(() => {
    mockUseListTransactions.mockReset();
    mockUseListCategories.mockReset();
  });

  it('두 쿼리가 모두 pending(데이터 없음, 복원 중 idle 포함)이면 isLoading이 true다', () => {
    // 영속화 캐시 복원 중에는 isPending: true, fetchStatus: 'idle' → isLoading이 false가 되므로
    // isLoading이 아니라 isPending을 기준으로 로딩을 판단해야 한다.
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ isPending: true }),
    );
    mockUseListCategories.mockReturnValue(makeQueryState({ isPending: true }));

    const { result } = renderDashboard();

    expect(result.current.isLoading).toBe(true);
  });

  it('householdId가 null이면 두 쿼리가 pending이어도 isLoading은 false다', () => {
    // householdId가 없으면 쿼리가 enabled: false로 영원히 pending이므로 로딩으로 취급하지 않는다.
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ isPending: true }),
    );
    mockUseListCategories.mockReturnValue(makeQueryState({ isPending: true }));

    const { result } = renderDashboard(null);

    expect(result.current.isLoading).toBe(false);
  });

  it('데이터가 있고 백그라운드 갱신 중이면 isLoading은 false, isFetching은 true다', () => {
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ data: TRANSACTIONS_DATA, isFetching: true }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: CATEGORIES_DATA, isFetching: true }),
    );

    const { result } = renderDashboard();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(true);
  });

  it('둘 중 하나만 갱신 중이어도 isFetching은 true다', () => {
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ data: TRANSACTIONS_DATA }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: CATEGORIES_DATA, isFetching: true }),
    );

    const { result } = renderDashboard();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(true);
  });

  it('데이터가 있고 갱신 중이 아니면 isLoading과 isFetching이 모두 false다', () => {
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ data: TRANSACTIONS_DATA }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: CATEGORIES_DATA }),
    );

    const { result } = renderDashboard();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});

describe('useHomeDashboard - hasData', () => {
  beforeEach(() => {
    mockUseListTransactions.mockReset();
    mockUseListCategories.mockReset();
  });

  it('두 쿼리 모두 data가 있으면 hasData가 true다', () => {
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ data: TRANSACTIONS_DATA }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: CATEGORIES_DATA }),
    );

    const { result } = renderDashboard();

    expect(result.current.hasData).toBe(true);
  });

  it('거래 데이터만 없으면 hasData가 false다', () => {
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ data: undefined, isPending: true }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: CATEGORIES_DATA }),
    );

    const { result } = renderDashboard();

    expect(result.current.hasData).toBe(false);
  });

  it('카테고리 데이터만 없으면 hasData가 false다', () => {
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ data: TRANSACTIONS_DATA }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: undefined, isPending: true }),
    );

    const { result } = renderDashboard();

    expect(result.current.hasData).toBe(false);
  });

  it('데이터가 있으면 error가 있어도 hasData는 true다(이전 데이터 유지)', () => {
    mockUseListTransactions.mockReturnValue(
      makeQueryState({ data: TRANSACTIONS_DATA, error: new Error('실패') }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: CATEGORIES_DATA }),
    );

    const { result } = renderDashboard();

    expect(result.current.hasData).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useHomeDashboard - refetch', () => {
  beforeEach(() => {
    mockUseListTransactions.mockReset();
    mockUseListCategories.mockReset();
  });

  it('refetch를 호출하면 거래·카테고리 쿼리의 refetch를 각각 1회 호출한다', async () => {
    const refetchTransactions = vi.fn(async () => ({}));
    const refetchCategories = vi.fn(async () => ({}));

    mockUseListTransactions.mockReturnValue(
      makeQueryState({
        data: TRANSACTIONS_DATA,
        refetch: refetchTransactions,
      }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: CATEGORIES_DATA, refetch: refetchCategories }),
    );

    const { result } = renderDashboard();

    await result.current.refetch();

    expect(refetchTransactions).toHaveBeenCalledTimes(1);
    expect(refetchCategories).toHaveBeenCalledTimes(1);
  });

  it('refetch는 두 쿼리의 refetch가 모두 끝난 뒤 resolve되는 Promise를 반환한다', async () => {
    let resolveTransactions: (() => void) | undefined;
    const refetchTransactions = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveTransactions = resolve;
        }),
    );
    const refetchCategories = vi.fn(async () => ({}));

    mockUseListTransactions.mockReturnValue(
      makeQueryState({
        data: TRANSACTIONS_DATA,
        refetch: refetchTransactions,
      }),
    );
    mockUseListCategories.mockReturnValue(
      makeQueryState({ data: CATEGORIES_DATA, refetch: refetchCategories }),
    );

    const { result } = renderDashboard();

    let settled = false;
    const promise = Promise.resolve(result.current.refetch()).then(() => {
      settled = true;
    });

    // 거래 refetch가 아직 끝나지 않았으므로 전체 refetch도 끝나지 않아야 한다
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveTransactions?.();
    await promise;

    expect(settled).toBe(true);
  });
});
