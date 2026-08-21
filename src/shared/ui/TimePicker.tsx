'use client';

import { Clock } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { useDismissable } from '@/shared/lib';

import styles from './timePicker.module.css';

type Props = {
  id: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  open?: boolean;
  ariaLabel?: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
};

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_STEP = 5;

const pad = (value: number) => String(value).padStart(2, '0');

const parseTime = (value: string) => {
  const [hourText = '0', minuteText = '0'] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
};

const formatTime = (hour: number, minute: number) => {
  return `${pad(hour)}:${pad(minute)}`;
};

const buildMinuteOptions = (currentMinute: number) => {
  const steps = Array.from({ length: 12 }, (_, index) => index * MINUTE_STEP);
  if (steps.includes(currentMinute)) {
    return steps;
  }

  return [...steps, currentMinute].sort((left, right) => left - right);
};

export const TimePicker = ({
  id,
  value,
  disabled = false,
  required = false,
  open,
  ariaLabel,
  onChange,
  onOpenChange,
}: Props) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedHourRef = useRef<HTMLButtonElement>(null);
  const selectedMinuteRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const { hour, minute } = parseTime(value);
  const isOpen = open ?? uncontrolledOpen;
  const minuteOptions = buildMinuteOptions(minute);

  const setIsOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (open === undefined) {
      setUncontrolledOpen(next);
    }
  };

  useDismissable(isOpen, () => setIsOpen(false), rootRef);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const scrollToSelected = (button: HTMLButtonElement | null) => {
      const column = button?.parentElement;
      if (!button || !column) {
        return;
      }

      const columnRect = column.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      column.scrollTop +=
        buttonRect.top -
        columnRect.top -
        column.clientHeight / 2 +
        button.clientHeight / 2;
    };

    scrollToSelected(selectedHourRef.current);
    scrollToSelected(selectedMinuteRef.current);
  }, [isOpen]);

  const handleHourSelect = (nextHour: number) => {
    onChange(formatTime(nextHour, minute));
  };

  const handleMinuteSelect = (nextMinute: number) => {
    onChange(formatTime(hour, nextMinute));
    setIsOpen(false);
  };

  return (
    <div
      className={`${styles.field} ${isOpen ? styles.fieldOpen : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.triggerLabel}>{formatTime(hour, minute)}</span>
        <Clock className={styles.triggerIcon} size={18} aria-hidden />
      </button>
      <input
        className={styles.visuallyHidden}
        type="text"
        value={value}
        required={required}
        tabIndex={-1}
        readOnly
        aria-hidden
      />
      {isOpen ? (
        <div
          className={styles.panel}
          id={dialogId}
          role="dialog"
          aria-label="시간 선택"
        >
          <div className={styles.columnWrap}>
            <p className={styles.columnLabel}>시</p>
            <div className={styles.column} role="listbox" aria-label="시">
              {HOURS.map((option) => (
                <button
                  key={option}
                  ref={option === hour ? selectedHourRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={option === hour}
                  className={`${styles.option} ${option === hour ? styles.optionActive : ''}`}
                  onClick={() => handleHourSelect(option)}
                >
                  {pad(option)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.columnWrap}>
            <p className={styles.columnLabel}>분</p>
            <div className={styles.column} role="listbox" aria-label="분">
              {minuteOptions.map((option) => (
                <button
                  key={option}
                  ref={option === minute ? selectedMinuteRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={option === minute}
                  className={`${styles.option} ${option === minute ? styles.optionActive : ''}`}
                  onClick={() => handleMinuteSelect(option)}
                >
                  {pad(option)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
