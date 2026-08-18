'use client';

import { Calendar } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'react-day-picker/locale';

import 'react-day-picker/style.css';

import styles from './write.module.css';

type Props = {
  id?: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
};

const toDate = (value: string) => {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
};

const toValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (value: string) => {
  const date = toDate(value);
  if (!date) {
    return '날짜 선택';
  }

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const formatCaption = (month: Date) => {
  return `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
};

export const DatePicker = ({
  id = 'transactionDate',
  value,
  disabled = false,
  required = false,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const selected = toDate(value);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.addEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (date: Date) => {
    onChange(toValue(date));
    setOpen(false);
  };

  const handleToday = () => {
    onChange(toValue(new Date()));
    setOpen(false);
  };

  return (
    <div className={styles.popoverField} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={styles.popoverTrigger}
        aria-expanded={open}
        aria-controls={dialogId}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.popoverTriggerLabel}>
          {formatDateLabel(value)}
        </span>
        <Calendar className={styles.popoverChevron} size={18} aria-hidden />
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
      {open ? (
        <div
          className={`${styles.popover} ${styles.datePopover}`}
          id={dialogId}
          role="dialog"
          aria-label="날짜 선택"
        >
          <DayPicker
            mode="single"
            required
            locale={ko}
            navLayout="around"
            showOutsideDays
            selected={selected}
            defaultMonth={selected}
            onSelect={handleSelect}
            className={styles.datePicker}
            formatters={{ formatCaption }}
          />
          <div className={styles.datePickerFooter}>
            <button
              type="button"
              className={styles.textButton}
              onClick={handleToday}
            >
              오늘
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
