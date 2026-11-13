import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useToast } from '@/shared/ui';

import { WriteEditPage } from './index';

const router = {
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
};

const transaction = { id: 7, householdId: 'household-1', amount: 1000 };

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/write/7',
}));

vi.mock('@/features/household', () => ({
  useCurrentHousehold: () => ({
    householdId: 'household-1',
    isLoading: false,
  }),
}));

vi.mock('@/features/transaction', () => ({
  useGetTransaction: () => ({
    data: transaction,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../ui/TransactionForm', () => ({
  TransactionForm: ({
    onSuccess,
    onDelete,
  }: {
    onSuccess: () => void;
    onDelete?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onSuccess}>
        저장 성공
      </button>
      <button type="button" onClick={onDelete}>
        삭제 열기
      </button>
    </div>
  ),
}));

vi.mock('../ui/TransactionDeleteConfirm', () => ({
  TransactionDeleteConfirm: ({
    onSuccess,
    onCancel,
  }: {
    onSuccess: () => void;
    onCancel: () => void;
  }) => (
    <div role="dialog">
      <button type="button" onClick={onSuccess}>
        삭제 성공
      </button>
      <button type="button" onClick={onCancel}>
        삭제 취소
      </button>
    </div>
  ),
}));

const originalShowToast = useToast.getState().showToast;
const showToast = vi.fn();

// 이 탭에서 앱 내 이전 화면이 있는 상태를 만든다.
const seedInAppHistory = () => {
  window.sessionStorage.setItem('moa:inAppHistory', '1');
};

const openDelete = () => {
  fireEvent.click(screen.getByRole('button', { name: '삭제 열기' }));
};

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  useToast.setState({ showToast, message: null });
});

afterEach(() => {
  window.sessionStorage.clear();
  useToast.setState({ showToast: originalShowToast, message: null });
});

describe('WriteEditPage 저장 완료 후 이동', () => {
  it('앱 내 이전 화면이 있으면 저장 성공 시 router.back() 으로 돌아간다', () => {
    seedInAppHistory();
    render(<WriteEditPage transactionId={7} />);

    fireEvent.click(screen.getByRole('button', { name: '저장 성공' }));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("앱 내 이전 화면이 없으면 저장 성공 시 router.replace('/') 로 이동한다", () => {
    render(<WriteEditPage transactionId={7} />);

    fireEvent.click(screen.getByRole('button', { name: '저장 성공' }));

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('WriteEditPage 삭제 완료 후 이동', () => {
  it('삭제 확인 창을 열기만 해서는 이동하지 않는다', () => {
    seedInAppHistory();
    render(<WriteEditPage transactionId={7} />);

    openDelete();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('삭제 취소 시 이동하지 않고 확인 창만 닫는다', () => {
    seedInAppHistory();
    render(<WriteEditPage transactionId={7} />);

    openDelete();
    fireEvent.click(screen.getByRole('button', { name: '삭제 취소' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('앱 내 이전 화면이 있으면 삭제 성공 시 router.back() 으로 돌아간다', () => {
    seedInAppHistory();
    render(<WriteEditPage transactionId={7} />);

    openDelete();
    fireEvent.click(screen.getByRole('button', { name: '삭제 성공' }));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("앱 내 이전 화면이 없으면 삭제 성공 시 router.replace('/') 로 이동한다", () => {
    render(<WriteEditPage transactionId={7} />);

    openDelete();
    fireEvent.click(screen.getByRole('button', { name: '삭제 성공' }));

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('WriteEditPage 성공 토스트', () => {
  it("수정 저장 성공 시 '저장했어요' 토스트를 띄운다", () => {
    seedInAppHistory();
    render(<WriteEditPage transactionId={7} />);

    fireEvent.click(screen.getByRole('button', { name: '저장 성공' }));

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0]).toBe('저장했어요');
  });

  it("삭제 성공 시 '삭제했어요' 토스트를 띄운다", () => {
    seedInAppHistory();
    render(<WriteEditPage transactionId={7} />);

    openDelete();
    fireEvent.click(screen.getByRole('button', { name: '삭제 성공' }));

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0]).toBe('삭제했어요');
  });

  it('직접 진입해 fallback 으로 이동하는 경우에도 토스트를 띄운다', () => {
    render(<WriteEditPage transactionId={7} />);

    fireEvent.click(screen.getByRole('button', { name: '저장 성공' }));

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0]).toBe('저장했어요');
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('삭제 확인 창을 열거나 취소해도 토스트를 띄우지 않는다', () => {
    render(<WriteEditPage transactionId={7} />);

    openDelete();
    fireEvent.click(screen.getByRole('button', { name: '삭제 취소' }));

    expect(showToast).not.toHaveBeenCalled();
  });
});
