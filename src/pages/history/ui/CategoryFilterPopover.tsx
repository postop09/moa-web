'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type { Category } from '@/entities/category';

import type { CategoryFilter } from '../model/useTransactionHistory';
import styles from './history.module.css';

type Props = {
  categories: Category[];
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
};

export const CategoryFilterPopover = ({
  categories,
  value,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

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
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selected =
    value === 'all' ? null : categories.find((item) => item.id === value);
  const label = selected?.name ?? '전체';

  return (
    <div className={styles.popoverField} ref={rootRef}>
      <button
        type="button"
        className={styles.popoverTrigger}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label="카테고리 필터"
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
                aria-selected={value === 'all'}
                className={`${styles.popoverOption} ${value === 'all' ? styles.popoverOptionActive : ''}`}
                onClick={() => {
                  onChange('all');
                  setOpen(false);
                }}
              >
                전체
              </button>
            </li>
            {categories.map((category) => {
              const isActive = value === category.id;

              return (
                <li key={category.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`${styles.popoverOption} ${isActive ? styles.popoverOptionActive : ''}`}
                    onClick={() => {
                      onChange(category.id);
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
