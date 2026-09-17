'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import styles from './home.module.css';

type Props = {
  value: Date;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  disabled?: boolean;
};

const formatMonthLabel = (date: Date) => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};

export const MonthNavigator = ({
  value,
  onPrev,
  onNext,
  canGoNext,
  disabled = false,
}: Props) => {
  return (
    <div className={styles.monthNavigator}>
      <button
        type="button"
        className={styles.monthNavButton}
        onClick={onPrev}
        disabled={disabled}
        aria-label="이전 달"
      >
        <ChevronLeft size={20} aria-hidden />
      </button>
      <p className={styles.monthNavLabel}>{formatMonthLabel(value)}</p>
      <button
        type="button"
        className={styles.monthNavButton}
        onClick={onNext}
        disabled={disabled || !canGoNext}
        aria-label="다음 달"
      >
        <ChevronRight size={20} aria-hidden />
      </button>
    </div>
  );
};
