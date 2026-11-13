import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { transactionQueryKeys } from '../config/queryKeys';
import { useDeleteTransaction } from './useDeleteTransaction';

const mocks = vi.hoisted(() => ({
  deleteTransaction: vi.fn(),
  createBrowserClient: vi.fn(),
}));

vi.mock('@/entities/transaction', () => ({
  deleteTransaction: mocks.deleteTransaction,
}));

vi.mock('@/shared/api', () => ({
  createBrowserClient: mocks.createBrowserClient,
}));

const HOUSEHOLD_ID = 'household-1';
const DELETED_ID = 7;

const createClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

const setup = async () => {
  const queryClient = createClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const fetchDetail = vi.fn(async () => ({ id: DELETED_ID }));
  const fetchOtherDetail = vi.fn(async () => ({ id: 8 }));
  const fetchList = vi.fn(async () => []);
  const fetchOtherHouseholdList = vi.fn(async () => []);

  // 화면에 떠 있는 활성 쿼리 옵저버들. invalidate 되면 refetch 되고, 제거되면 refetch 되지 않는다.
  // 실제 앱처럼 mutation 을 쓰는 컴포넌트(삭제 다이얼로그)와도, 서로와도 별개의 컴포넌트에서 렌더한다.
  // 같은 컴포넌트에 두면 mutation 상태나 다른 쿼리의 리렌더가 옵저버를 재설정해
  // 제거된 쿼리를 다시 만들어 조회해 버린다.
  const Observer = ({
    queryKey,
    queryFn,
  }: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
  }) => {
    const { status } = useQuery({ queryKey, queryFn });
    return <span>{status}</span>;
  };
  render(
    <>
      <Observer
        queryKey={transactionQueryKeys.detail(DELETED_ID)}
        queryFn={fetchDetail}
      />
      <Observer
        queryKey={transactionQueryKeys.detail(8)}
        queryFn={fetchOtherDetail}
      />
      <Observer
        queryKey={transactionQueryKeys.list(HOUSEHOLD_ID, '2026-01-01')}
        queryFn={fetchList}
      />
      <Observer
        queryKey={transactionQueryKeys.list('household-2', '2026-01-01')}
        queryFn={fetchOtherHouseholdList}
      />
    </>,
    { wrapper },
  );

  // 삭제 mutation 은 같은 queryClient 를 공유하는 별도 컴포넌트에서 호출한다.
  const view = renderHook(() => useDeleteTransaction(HOUSEHOLD_ID), {
    wrapper,
  });

  // 옵저버들이 데이터를 받아 화면에 반영(리렌더)될 때까지 기다린다.
  // 첫 조회 결과의 리렌더가 삭제 이후로 밀리면 그 리렌더가 제거된 쿼리를 되살리는 것처럼 보이기 때문이다.
  await waitFor(() => expect(screen.getAllByText('success')).toHaveLength(4));

  return {
    queryClient,
    view,
    fetchDetail,
    fetchOtherDetail,
    fetchList,
    fetchOtherHouseholdList,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createBrowserClient.mockReturnValue({});
  mocks.deleteTransaction.mockResolvedValue(undefined);
});

describe('useDeleteTransaction 삭제 성공 후 캐시 처리', () => {
  it('삭제 성공 시 삭제된 행의 id 로 deleteTransaction 을 호출한다', async () => {
    const { view } = await setup();

    await act(async () => {
      await view.result.current.mutateAsync(DELETED_ID);
    });

    expect(mocks.deleteTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.deleteTransaction.mock.calls[0][1]).toBe(DELETED_ID);
  });

  it('삭제된 행의 상세 쿼리는 캐시에서 제거되고 다시 조회하지 않는다', async () => {
    const { queryClient, view, fetchDetail } = await setup();
    await waitFor(() => expect(fetchDetail).toHaveBeenCalledTimes(1));
    expect(
      queryClient.getQueryData(transactionQueryKeys.detail(DELETED_ID)),
    ).toBeDefined();

    await act(async () => {
      await view.result.current.mutateAsync(DELETED_ID);
    });
    // 비동기 refetch 가 있다면 일어날 시간을 준다.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(fetchDetail).toHaveBeenCalledTimes(1);
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: transactionQueryKeys.detail(DELETED_ID) }),
    ).toBeUndefined();
  });

  it('해당 가계의 목록 쿼리는 여전히 invalidate 되어 다시 조회된다', async () => {
    const { view, fetchList } = await setup();
    await waitFor(() => expect(fetchList).toHaveBeenCalledTimes(1));

    await act(async () => {
      await view.result.current.mutateAsync(DELETED_ID);
    });

    await waitFor(() => expect(fetchList).toHaveBeenCalledTimes(2));
  });

  it('다른 거래의 상세·다른 가계의 목록 쿼리는 건드리지 않는다', async () => {
    const { queryClient, view, fetchOtherDetail, fetchOtherHouseholdList } =
      await setup();
    await waitFor(() => expect(fetchOtherDetail).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(fetchOtherHouseholdList).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      await view.result.current.mutateAsync(DELETED_ID);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(fetchOtherDetail).toHaveBeenCalledTimes(1);
    expect(fetchOtherHouseholdList).toHaveBeenCalledTimes(1);
    expect(
      queryClient.getQueryData(transactionQueryKeys.detail(8)),
    ).toBeDefined();
  });

  it('삭제가 실패하면 상세 쿼리를 제거하지 않고 목록도 다시 조회하지 않는다', async () => {
    mocks.deleteTransaction.mockRejectedValue(new Error('network'));
    const { queryClient, view, fetchDetail, fetchList } = await setup();
    await waitFor(() => expect(fetchDetail).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(fetchList).toHaveBeenCalledTimes(1));

    await act(async () => {
      await view.result.current.mutateAsync(DELETED_ID).catch(() => {});
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(fetchDetail).toHaveBeenCalledTimes(1);
    expect(fetchList).toHaveBeenCalledTimes(1);
    expect(
      queryClient.getQueryData(transactionQueryKeys.detail(DELETED_ID)),
    ).toBeDefined();
  });
});
