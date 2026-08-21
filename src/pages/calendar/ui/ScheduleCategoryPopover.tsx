'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import type { ScheduleCategory } from '@/entities/scheduleCategory';
import { useDismissable } from '@/shared/lib';

import styles from './calendar.module.css';

type Props = {
  categories: ScheduleCategory[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onCreate: () => void;
};

export const ScheduleCategoryPopover = ({
  categories,
  value,
  disabled = false,
  onChange,
  onCreate,
}: Props) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  useDismissable(open, () => setOpen(false), rootRef);

  const selected = categories.find((item) => String(item.id) === value);
  const label = selected?.name ?? '선택 안 함';

  return (
    <div className={styles.popoverField} ref={rootRef}>
      <button
        type="button"
        id="scheduleCategory"
        className={styles.popoverTrigger}
        aria-labelledby="scheduleCategoryLabel"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.popoverTriggerBody}>
          {selected ? (
            <span
              className={styles.authorDot}
              style={{ background: selected.color }}
              aria-hidden
            />
          ) : null}
          <span className={styles.popoverTriggerLabel}>{label}</span>
        </span>
        <ChevronDown
          className={`${styles.popoverChevron} ${open ? styles.popoverChevronOpen : ''}`}
          size={18}
          aria-hidden
        />
      </button>

      {open ? (
        <div className={styles.popover} id={listId} role="listbox">
          <ul className={styles.popoverList}>
            <li>
              <button
                type="button"
                role="option"
                aria-selected={value === ''}
                className={`${styles.popoverOption} ${value === '' ? styles.popoverOptionActive : ''}`}
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                선택 안 함
              </button>
            </li>
            {categories.map((category) => {
              const optionValue = String(category.id);
              const isActive = optionValue === value;

              return (
                <li key={category.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`${styles.popoverOption} ${isActive ? styles.popoverOptionActive : ''}`}
                    onClick={() => {
                      onChange(optionValue);
                      setOpen(false);
                    }}
                  >
                    <span
                      className={styles.authorDot}
                      style={{ background: category.color }}
                      aria-hidden
                    />
                    {category.name}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className={styles.popoverAdd}
            onClick={() => {
              setOpen(false);
              onCreate();
            }}
          >
            카테고리 추가
          </button>
        </div>
      ) : null}
    </div>
  );
};
