'use client';

import { create } from 'zustand';

import styles from './toast.module.css';

type Tone = 'default' | 'error';

type ShowToastOptions = {
  tone?: Tone;
};

const TOAST_DURATION_MS: Record<Tone, number> = {
  default: 3000,
  // 실패 안내는 읽을 시간을 더 준다.
  error: 6000,
};

type ToastState = {
  message: string | null;
  tone: Tone;
  showToast: (message: string, options?: ShowToastOptions) => void;
};

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'default',
  showToast: (message, options) => {
    const tone = options?.tone ?? 'default';
    // 새 토스트가 이전 토스트의 타이머 때문에 일찍 사라지지 않게 한다.
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ message, tone });
    dismissTimer = setTimeout(() => {
      dismissTimer = null;
      set({ message: null });
    }, TOAST_DURATION_MS[tone]);
  },
}));

/** 앱 셸에 한 번만 마운트한다. live region은 내용이 바뀌기 전에 존재해야 읽히므로 항상 렌더한다. */
export const ToastViewport = () => {
  const message = useToast((state) => state.message);
  const tone = useToast((state) => state.tone);

  return (
    <div className={styles.viewport} role="status">
      {message ? (
        <p className={tone === 'error' ? styles.toastError : styles.toast}>
          {message}
        </p>
      ) : null}
    </div>
  );
};
