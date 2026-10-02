import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastViewport, useToast } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runAllTimers();
    });
    vi.useRealTimers();
  });

  it('showToast를 호출하면 role="status" 영역에 메시지가 보인다', () => {
    render(<ToastViewport />);

    act(() => {
      useToast.getState().showToast('문의가 삭제됐어요');
    });

    expect(screen.getByRole('status')).toHaveTextContent('문의가 삭제됐어요');
  });

  it('훅으로 꺼낸 showToast로도 메시지를 띄울 수 있다', () => {
    const Trigger = () => {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast('복사했어요')}>
          알림
        </button>
      );
    };
    render(
      <>
        <Trigger />
        <ToastViewport />
      </>,
    );

    act(() => {
      screen.getByRole('button', { name: '알림' }).click();
    });

    expect(screen.getByRole('status')).toHaveTextContent('복사했어요');
  });

  it('약 3초 뒤에 자동으로 사라진다', () => {
    render(<ToastViewport />);
    act(() => {
      useToast.getState().showToast('곧 사라져요');
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('곧 사라져요')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('곧 사라져요')).not.toBeInTheDocument();
  });

  it('한 번에 하나만 보여주며 새 토스트가 이전 토스트를 대체한다', () => {
    render(<ToastViewport />);

    act(() => {
      useToast.getState().showToast('첫 번째');
    });
    act(() => {
      useToast.getState().showToast('두 번째');
    });

    expect(screen.queryByText('첫 번째')).not.toBeInTheDocument();
    expect(screen.getByText('두 번째')).toBeInTheDocument();
  });

  it('새 토스트가 뜨면 이전 토스트의 타이머가 새 토스트를 일찍 지우지 않는다', () => {
    render(<ToastViewport />);
    act(() => {
      useToast.getState().showToast('첫 번째');
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      useToast.getState().showToast('두 번째');
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('두 번째')).toBeInTheDocument();
  });

  it('기본 토스트는 3초에 사라진다', () => {
    render(<ToastViewport />);
    act(() => {
      useToast.getState().showToast('기본');
    });

    act(() => {
      vi.advanceTimersByTime(2900);
    });
    expect(screen.getByText('기본')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByText('기본')).not.toBeInTheDocument();
  });

  it('에러 톤 토스트는 6초 동안 유지된다', () => {
    render(<ToastViewport />);
    act(() => {
      useToast.getState().showToast('실패했어요', { tone: 'error' });
    });

    act(() => {
      vi.advanceTimersByTime(5900);
    });
    expect(screen.getByText('실패했어요')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByText('실패했어요')).not.toBeInTheDocument();
  });

  it('에러 토스트 뒤에 뜬 기본 토스트는 이전 6초 타이머가 아닌 3초 기준으로 사라진다', () => {
    render(<ToastViewport />);
    act(() => {
      useToast.getState().showToast('실패했어요', { tone: 'error' });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      useToast.getState().showToast('복사했어요');
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('복사했어요')).not.toBeInTheDocument();
  });
});
