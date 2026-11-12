import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useToast } from '@/shared/ui';

import * as writePageModule from './index';

const { WritePage } = writePageModule;

const router = {
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/write',
}));

vi.mock('@/features/household', () => ({
  HouseholdGuard: ({
    children,
  }: {
    children: (householdId: string) => React.ReactNode;
  }) => <>{children('household-1')}</>,
}));

vi.mock('./ui/TransactionForm', () => ({
  TransactionForm: ({
    mode,
    onSuccess,
  }: {
    mode: { type: string };
    onSuccess: () => void;
  }) => (
    <button type="button" data-mode={mode.type} onClick={onSuccess}>
      저장 성공
    </button>
  ),
}));

const originalShowToast = useToast.getState().showToast;
const showToast = vi.fn();

// 이 탭에서 앱 내 이전 화면이 있는 상태를 만든다.
const seedInAppHistory = () => {
  window.sessionStorage.setItem('moa:inAppHistory', '1');
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

describe('pages/write index public API', () => {
  it('WritePage를 계속 export한다', () => {
    expect(writePageModule.WritePage).toBeDefined();
  });

  it('WriteEditPage를 re-export한다', () => {
    expect(writePageModule.WriteEditPage).toBeDefined();
  });
});

describe('WritePage 작성 완료 후 이동', () => {
  it('앱 내 이전 화면이 있으면 작성 성공 시 router.back() 으로 돌아간다', () => {
    seedInAppHistory();
    render(<WritePage />);

    fireEvent.click(screen.getByRole('button', { name: '저장 성공' }));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("앱 내 이전 화면이 없으면(직접 진입) 작성 성공 시 router.replace('/') 로 이동한다", () => {
    render(<WritePage />);

    fireEvent.click(screen.getByRole('button', { name: '저장 성공' }));

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('작성 성공 전에는 이동하지 않는다', () => {
    seedInAppHistory();
    render(<WritePage />);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('WritePage 작성 성공 토스트', () => {
  it("작성 성공 시 '추가했어요' 토스트를 띄운다", () => {
    seedInAppHistory();
    render(<WritePage />);

    fireEvent.click(screen.getByRole('button', { name: '저장 성공' }));

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0]).toBe('추가했어요');
  });

  it('직접 진입해 fallback 으로 이동하는 경우에도 토스트를 띄운다', () => {
    render(<WritePage />);

    fireEvent.click(screen.getByRole('button', { name: '저장 성공' }));

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0]).toBe('추가했어요');
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('작성 성공 전에는 토스트를 띄우지 않는다', () => {
    render(<WritePage />);

    expect(showToast).not.toHaveBeenCalled();
  });
});
