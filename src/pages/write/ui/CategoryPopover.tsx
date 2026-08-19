'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import type { Category } from '@/entities/category';
import { useDismissable } from '@/shared/lib';

import styles from './write.module.css';

type Props = {
  categories: Category[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export const CategoryPopover = ({
  categories,
  value,
  disabled = false,
  onChange,
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
        id="transactionCategory"
        className={styles.popoverTrigger}
        aria-labelledby="transactionCategoryLabel"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.popoverTriggerLabel}>{label}</span>
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
                    {category.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
