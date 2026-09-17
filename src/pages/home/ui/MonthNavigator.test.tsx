import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MonthNavigator } from './MonthNavigator';

const renderNavigator = (
  overrides: Partial<Parameters<typeof MonthNavigator>[0]> = {},
) => {
  const props = {
    value: new Date(2026, 7, 1),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    canGoNext: true,
    ...overrides,
  };

  return { ...render(<MonthNavigator {...props} />), props };
};

describe('MonthNavigator', () => {
  it('선택된 월을 "YYYY년 M월" 형식으로 보여준다', () => {
    renderNavigator({ value: new Date(2026, 7, 1) });

    expect(screen.getByText('2026년 8월')).toBeInTheDocument();
  });

  describe('disabled prop이 없을 때(기존 동작)', () => {
    it('canGoNext가 true면 이전/다음 버튼이 모두 활성 상태다', () => {
      renderNavigator({ canGoNext: true });

      expect(screen.getByRole('button', { name: '이전 달' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '다음 달' })).toBeEnabled();
    });

    it('canGoNext가 false면 다음 버튼만 비활성화되고 이전 버튼은 활성 상태다', () => {
      renderNavigator({ canGoNext: false });

      expect(screen.getByRole('button', { name: '이전 달' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '다음 달' })).toBeDisabled();
    });

    it('이전/다음 버튼 클릭 시 각각 onPrev/onNext를 호출한다', () => {
      const { props } = renderNavigator({ canGoNext: true });

      fireEvent.click(screen.getByRole('button', { name: '이전 달' }));
      fireEvent.click(screen.getByRole('button', { name: '다음 달' }));

      expect(props.onPrev).toHaveBeenCalledTimes(1);
      expect(props.onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled prop', () => {
    it('disabled면 canGoNext가 true여도 이전/다음 버튼이 모두 비활성화된다', () => {
      renderNavigator({ disabled: true, canGoNext: true });

      expect(screen.getByRole('button', { name: '이전 달' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '다음 달' })).toBeDisabled();
    });

    it('disabled면 버튼을 클릭해도 onPrev/onNext가 호출되지 않는다', () => {
      const { props } = renderNavigator({ disabled: true, canGoNext: true });

      fireEvent.click(screen.getByRole('button', { name: '이전 달' }));
      fireEvent.click(screen.getByRole('button', { name: '다음 달' }));

      expect(props.onPrev).not.toHaveBeenCalled();
      expect(props.onNext).not.toHaveBeenCalled();
    });

    it('disabled가 false면 canGoNext 규칙만 적용된다', () => {
      renderNavigator({ disabled: false, canGoNext: false });

      expect(screen.getByRole('button', { name: '이전 달' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '다음 달' })).toBeDisabled();
    });
  });
});
