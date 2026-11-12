import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Transaction } from '@/entities/transaction';

import { TransactionDeleteConfirm } from './TransactionDeleteConfirm';

const mocks = vi.hoisted(() => ({
  useDeleteTransaction: vi.fn(),
}));

vi.mock('@/features/transaction', () => ({
  useDeleteTransaction: mocks.useDeleteTransaction,
}));

const HOUSEHOLD_ID = 'household-1';

const transaction: Transaction = {
  id: 7,
  householdId: HOUSEHOLD_ID,
  type: 'expense',
  name: '점심',
  amount: 12000,
  isRecurring: false,
  recurringDay: null,
  recurringSourceId: null,
  categoryId: null,
  memo: null,
  createdBy: 'user-1',
  createdDt: '2026-01-01T00:00:00.000Z',
  updatedDt: '2026-01-01T00:00:00.000Z',
  transactionDt: '2026-01-15T03:00:00.000Z',
};

const mockDelete = (mutateAsync: ReturnType<typeof vi.fn>) => {
  mocks.useDeleteTransaction.mockReturnValue({
    mutateAsync,
    isPending: false,
    error: null,
  });
};

const renderConfirm = (handlers: {
  onSuccess: () => void;
  onCancel?: () => void;
}) =>
  render(
    <TransactionDeleteConfirm
      householdId={HOUSEHOLD_ID}
      transaction={transaction}
      onCancel={handlers.onCancel ?? (() => {})}
      onSuccess={handlers.onSuccess}
    />,
  );

const clickConfirm = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
  });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TransactionDeleteConfirm', () => {
  it('삭제할 내역 이름을 보여주고, 열기만 해서는 삭제하지 않는다', () => {
    const mutateAsync = vi.fn();
    mockDelete(mutateAsync);

    renderConfirm({ onSuccess: vi.fn() });

    expect(screen.getByText('점심')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('확정 버튼을 누르면 해당 id 로 삭제를 호출하고 성공 시 onSuccess 를 호출한다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(7);
    const onSuccess = vi.fn();
    mockDelete(mutateAsync);
    renderConfirm({ onSuccess });

    await clickConfirm();

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith(7);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('취소를 누르면 삭제하지 않고 onCancel 을 호출한다', () => {
    const mutateAsync = vi.fn();
    const onCancel = vi.fn();
    mockDelete(mutateAsync);
    renderConfirm({ onSuccess: vi.fn(), onCancel });

    fireEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('삭제 성공 후 아직 마운트된 상태에서는 확정 버튼이 disabled 로 유지된다', async () => {
    mockDelete(vi.fn().mockResolvedValue(7));
    renderConfirm({ onSuccess: vi.fn() });

    await clickConfirm();

    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();
  });

  it('삭제 성공 후 확정 버튼을 다시 눌러도 삭제와 onSuccess 가 한 번 더 호출되지 않는다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(7);
    const onSuccess = vi.fn();
    mockDelete(mutateAsync);
    renderConfirm({ onSuccess });

    await clickConfirm();
    await clickConfirm();

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('삭제가 실패하면 잠기지 않아 다시 시도할 수 있고 onSuccess 는 호출되지 않는다', async () => {
    const mutateAsync = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(7);
    const onSuccess = vi.fn();
    mockDelete(mutateAsync);
    renderConfirm({ onSuccess });

    await clickConfirm();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '삭제' })).toBeEnabled();

    await clickConfirm();

    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
