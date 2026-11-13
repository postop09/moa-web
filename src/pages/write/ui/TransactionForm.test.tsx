import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Transaction } from '@/entities/transaction';

import { TransactionForm } from './TransactionForm';

const mocks = vi.hoisted(() => ({
  useListCategories: vi.fn(),
  useCreateTransaction: vi.fn(),
  useUpdateTransaction: vi.fn(),
}));

vi.mock('@/features/category', () => ({
  useListCategories: mocks.useListCategories,
}));

vi.mock('@/features/transaction', () => ({
  useCreateTransaction: mocks.useCreateTransaction,
  useUpdateTransaction: mocks.useUpdateTransaction,
}));

const HOUSEHOLD_ID = 'household-1';

const editTransaction: Transaction = {
  id: 1,
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

const mockCategories = ({ isLoading }: { isLoading: boolean }) => {
  mocks.useListCategories.mockReturnValue({
    data: isLoading ? undefined : [],
    isLoading,
  });
};

const renderCreate = () =>
  render(
    <TransactionForm
      householdId={HOUSEHOLD_ID}
      mode={{ type: 'create' }}
      onSuccess={() => {}}
    />,
  );

const renderEdit = () =>
  render(
    <TransactionForm
      householdId={HOUSEHOLD_ID}
      mode={{ type: 'edit', transaction: editTransaction }}
      onSuccess={() => {}}
    />,
  );

describe('TransactionForm 금액 입력 자동 포커스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    mockCategories({ isLoading: false });
  });

  it('create 모드에서 열리면 금액 입력에 포커스가 간다', () => {
    renderCreate();

    expect(screen.getByLabelText('금액')).toHaveFocus();
  });

  it('edit 모드에서는 금액 입력에 자동 포커스하지 않는다', () => {
    renderEdit();

    const amountInput = screen.getByLabelText('금액');
    expect(amountInput).toBeEnabled();
    expect(amountInput).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it('create 모드에서 카테고리 로딩 중에는 입력이 비활성이고, 로딩이 끝나 활성화되면 포커스가 간다', () => {
    mockCategories({ isLoading: true });
    const { rerender } = renderCreate();

    expect(screen.getByLabelText('금액')).toBeDisabled();
    expect(screen.getByLabelText('금액')).not.toHaveFocus();

    mockCategories({ isLoading: false });
    rerender(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'create' }}
        onSuccess={() => {}}
      />,
    );

    expect(screen.getByLabelText('금액')).toBeEnabled();
    expect(screen.getByLabelText('금액')).toHaveFocus();
  });

  it('edit 모드에서는 카테고리 로딩이 끝나 활성화되어도 포커스하지 않는다', () => {
    mockCategories({ isLoading: true });
    const { rerender } = renderEdit();

    mockCategories({ isLoading: false });
    rerender(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'edit', transaction: editTransaction }}
        onSuccess={() => {}}
      />,
    );

    expect(screen.getByLabelText('금액')).toBeEnabled();
    expect(screen.getByLabelText('금액')).not.toHaveFocus();
  });

  it('자동 포커스 이후 사용자가 다른 필드로 이동하면 리렌더 시 포커스를 다시 빼앗지 않는다', () => {
    const { rerender } = renderCreate();
    expect(screen.getByLabelText('금액')).toHaveFocus();

    act(() => {
      screen.getByLabelText('이름 (선택)').focus();
    });
    expect(screen.getByLabelText('이름 (선택)')).toHaveFocus();

    rerender(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'create' }}
        onSuccess={() => {}}
      />,
    );

    expect(screen.getByLabelText('이름 (선택)')).toHaveFocus();
    expect(screen.getByLabelText('금액')).not.toHaveFocus();
  });
});

describe('TransactionForm 자동 포커스 가드', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
  });

  const ui = () => (
    <>
      <button type="button">외부 버튼</button>
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'create' }}
        onSuccess={() => {}}
      />
    </>
  );

  it('로딩 중 사용자가 이미 다른 요소로 포커스를 옮겼다면, 로딩이 끝나도 금액 입력이 포커스를 가져가지 않는다', () => {
    mockCategories({ isLoading: true });
    const { rerender } = render(ui());

    act(() => {
      screen.getByRole('button', { name: '외부 버튼' }).focus();
    });
    expect(screen.getByRole('button', { name: '외부 버튼' })).toHaveFocus();

    mockCategories({ isLoading: false });
    rerender(ui());

    expect(screen.getByLabelText('금액')).toBeEnabled();
    expect(screen.getByLabelText('금액')).not.toHaveFocus();
    expect(screen.getByRole('button', { name: '외부 버튼' })).toHaveFocus();
  });

  it('가드로 건너뛴 뒤 재활성화돼도 포커스를 가져가지 않는다 (1회 처리 완료)', () => {
    mockCategories({ isLoading: true });
    const { rerender } = render(ui());

    act(() => {
      screen.getByRole('button', { name: '외부 버튼' }).focus();
    });
    mockCategories({ isLoading: false });
    rerender(ui());

    // 다시 비활성화됐다가 포커스가 body 로 돌아온 상태에서 재활성화
    mockCategories({ isLoading: true });
    rerender(ui());
    act(() => {
      screen.getByRole('button', { name: '외부 버튼' }).blur();
    });
    expect(document.body).toHaveFocus();

    mockCategories({ isLoading: false });
    rerender(ui());

    expect(screen.getByLabelText('금액')).toBeEnabled();
    expect(screen.getByLabelText('금액')).not.toHaveFocus();
  });

  it('자동 포커스가 한 번 일어난 뒤 비활성화됐다가 재활성화돼도 다시 포커스하지 않는다', () => {
    mockCategories({ isLoading: true });
    const { rerender } = render(ui());

    mockCategories({ isLoading: false });
    rerender(ui());
    expect(screen.getByLabelText('금액')).toHaveFocus();

    mockCategories({ isLoading: true });
    rerender(ui());
    // 비활성화된 입력은 blur 되지 않으므로, 사용자가 다른 곳으로 옮겼다가 포커스를 뺀 상황을 만든다.
    act(() => {
      screen.getByRole('button', { name: '외부 버튼' }).focus();
    });
    act(() => {
      screen.getByRole('button', { name: '외부 버튼' }).blur();
    });
    expect(document.body).toHaveFocus();
    mockCategories({ isLoading: false });
    rerender(ui());

    expect(screen.getByLabelText('금액')).toBeEnabled();
    expect(screen.getByLabelText('금액')).not.toHaveFocus();
  });
});

describe('TransactionForm 중복 제출 잠금', () => {
  const getSubmitButton = (container: HTMLElement) =>
    container.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  const fillAmount = () => {
    fireEvent.change(screen.getByLabelText('금액'), {
      target: { value: '5000' },
    });
  };

  const submitByClick = async (container: HTMLElement) => {
    await act(async () => {
      fireEvent.click(getSubmitButton(container));
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCategories({ isLoading: false });
  });

  it('create: 제출 성공 후 아직 마운트된 상태에서는 제출 버튼이 disabled 로 유지된다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onSuccess = vi.fn();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync,
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    const { container } = render(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'create' }}
        onSuccess={onSuccess}
      />,
    );
    fillAmount();

    await submitByClick(container);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(getSubmitButton(container)).toBeDisabled();
  });

  it('create: 성공 후 제출 버튼을 다시 눌러도 mutate 와 onSuccess 가 한 번 더 호출되지 않는다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onSuccess = vi.fn();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync,
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    const { container } = render(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'create' }}
        onSuccess={onSuccess}
      />,
    );
    fillAmount();

    await submitByClick(container);
    await submitByClick(container);

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('create: 성공 후 폼 submit 이벤트가 다시 들어와도 mutate 와 onSuccess 가 한 번 더 호출되지 않는다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onSuccess = vi.fn();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync,
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    const { container } = render(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'create' }}
        onSuccess={onSuccess}
      />,
    );
    fillAmount();

    await submitByClick(container);
    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('edit: 제출 성공 후 제출 버튼이 disabled 로 유지되고 재제출해도 update 가 한 번만 호출된다', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onSuccess = vi.fn();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync,
    });
    const { container } = render(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'edit', transaction: editTransaction }}
        onSuccess={onSuccess}
      />,
    );

    await submitByClick(container);
    expect(getSubmitButton(container)).toBeDisabled();

    await submitByClick(container);
    await act(async () => {
      fireEvent.submit(container.querySelector('form')!);
    });

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('edit: 저장 성공 후 아직 마운트된 상태에서는 삭제 버튼이 disabled 이고 눌러도 onDelete 가 호출되지 않는다', async () => {
    const onSuccess = vi.fn();
    const onDelete = vi.fn();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn().mockResolvedValue({}),
    });
    const { container } = render(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'edit', transaction: editTransaction }}
        onSuccess={onSuccess}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByRole('button', { name: '삭제' })).toBeEnabled();

    await submitByClick(container);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    expect(deleteButton).toBeDisabled();

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('edit: 저장이 실패하면 삭제 버튼은 잠기지 않고 눌러서 onDelete 를 호출할 수 있다', async () => {
    const onSuccess = vi.fn();
    const onDelete = vi.fn();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn().mockRejectedValue(new Error('network')),
    });
    const { container } = render(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'edit', transaction: editTransaction }}
        onSuccess={onSuccess}
        onDelete={onDelete}
      />,
    );

    await submitByClick(container);

    expect(onSuccess).not.toHaveBeenCalled();
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    expect(deleteButton).toBeEnabled();

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('제출이 실패하면 잠기지 않아 다시 제출할 수 있고 onSuccess 는 호출되지 않는다', async () => {
    const mutateAsync = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({});
    const onSuccess = vi.fn();
    mocks.useCreateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync,
    });
    mocks.useUpdateTransaction.mockReturnValue({
      isPending: false,
      error: null,
      mutateAsync: vi.fn(),
    });
    const { container } = render(
      <TransactionForm
        householdId={HOUSEHOLD_ID}
        mode={{ type: 'create' }}
        onSuccess={onSuccess}
      />,
    );
    fillAmount();

    await submitByClick(container);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(getSubmitButton(container)).toBeEnabled();

    await submitByClick(container);

    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
