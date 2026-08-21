'use client';

import { Calendar } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'react-day-picker/locale';

import 'react-day-picker/style.css';

import { useDismissable } from '@/shared/lib';

import styles from './datePicker.module.css';

type Props = {
  id?: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  open?: boolean;
  ariaLabel?: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
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
  open,
  ariaLabel,
  onChange,
  onOpenChange,
}: Props) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const selected = toDate(value);
  const isOpen = open ?? uncontrolledOpen;

  const setIsOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (open === undefined) {
      setUncontrolledOpen(next);
    }
  };

  useDismissable(isOpen, () => setIsOpen(false), rootRef);

  const handleSelect = (date: Date) => {
    onChange(toValue(date));
    setIsOpen(false);
  };

  const handleToday = () => {
    onChange(toValue(new Date()));
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
        <span className={styles.triggerLabel}>{formatDateLabel(value)}</span>
        <Calendar className={styles.triggerIcon} size={18} aria-hidden />
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
          <div className={styles.footer}>
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
