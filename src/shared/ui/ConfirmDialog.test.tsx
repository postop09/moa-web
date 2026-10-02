import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog';

const baseProps = {
  title: '삭제할까요?',
  message: '삭제하면 되돌릴 수 없어요.',
  confirmLabel: '삭제',
  onCancel: () => {},
  onConfirm: () => {},
};

describe('ConfirmDialog - 접근성', () => {
  it('role=alertdialog 이고 제목으로 이름이 붙으며 메시지가 설명으로 연결된다', () => {
    render(<ConfirmDialog {...baseProps} />);

    const dialog = screen.getByRole('alertdialog', { name: '삭제할까요?' });

    expect(dialog).toHaveAccessibleDescription('삭제하면 되돌릴 수 없어요.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('기본 포커스는 취소 버튼이다', () => {
    render(<ConfirmDialog {...baseProps} />);

    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
  });

  it('initialFocus="confirm" 이면 확인 버튼으로 포커스한다', () => {
    render(<ConfirmDialog {...baseProps} initialFocus="confirm" />);

    expect(screen.getByRole('button', { name: '삭제' })).toHaveFocus();
  });

  it('이탈 확인 구성(계속 쓰기/나가기, tone=default)에서도 "계속 쓰기"에 포커스가 간다', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        title="작성 중인 내용이 사라져요"
        message="지금 나가면 입력한 내용이 저장되지 않아요."
        cancelLabel="계속 쓰기"
        confirmLabel="나가기"
        tone="default"
        confirmEmphasis="subtle"
      />,
    );

    expect(screen.getByRole('button', { name: '계속 쓰기' })).toHaveFocus();
  });

  it('Tab 은 취소/확인 버튼 사이에서만 순환한다', () => {
    render(<ConfirmDialog {...baseProps} />);
    screen.getByRole('button', { name: '삭제' }).focus();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab' });

    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
  });
});

describe('ConfirmDialog - confirmEmphasis', () => {
  it('기본값은 primary', () => {
    render(<ConfirmDialog {...baseProps} />);

    expect(screen.getByRole('button', { name: '삭제' })).toHaveAttribute(
      'data-emphasis',
      'primary',
    );
  });

  it('subtle 이면 확인 버튼이 data-emphasis="subtle"', () => {
    render(<ConfirmDialog {...baseProps} confirmEmphasis="subtle" />);

    expect(screen.getByRole('button', { name: '삭제' })).toHaveAttribute(
      'data-emphasis',
      'subtle',
    );
  });
});

describe('ConfirmDialog - 선택적 props', () => {
  it('isPending/error/fallbackError/pendingLabel 없이도 렌더되고 동작한다', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('isPending 이면 pendingLabel 을 보이고 버튼이 비활성화된다 (기존 동작)', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        isPending
        pendingLabel="삭제하는 중…"
        error={null}
        fallbackError=""
      />,
    );

    const confirm = screen.getByRole('button', { name: '삭제하는 중…' });
    expect(confirm).toHaveAttribute('aria-disabled', 'true');
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
  });

  it('error 가 있으면 메시지를 보인다 (기존 동작)', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        error={new Error('서버 오류')}
        fallbackError="실패"
      />,
    );

    expect(screen.getByText('서버 오류')).toBeInTheDocument();
  });

  it('error 메시지는 role="alert" 로 알려진다', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        error={new Error('서버 오류')}
        fallbackError="실패"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('서버 오류');
  });

  it('error 가 없으면 role="alert" 가 없다', () => {
    render(<ConfirmDialog {...baseProps} error={null} fallbackError="" />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
