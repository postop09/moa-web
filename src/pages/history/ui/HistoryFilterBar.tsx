'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { Category } from '@/entities/category';
import { TRANSACTION_TYPE_LABEL } from '@/shared/model';

import type {
  CategoryFilter,
  TypeFilter,
} from '../model/useTransactionHistory';
import { CategoryFilterPopover } from './CategoryFilterPopover';
import styles from './history.module.css';

type Props = {
  selectedMonth: Date | null;
  typeFilter: TypeFilter;
  categoryId: CategoryFilter;
  categoryOptions: Category[];
  canGoNext: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onClearMonth: () => void;
  onTypeChange: (value: TypeFilter) => void;
  onCategoryChange: (value: CategoryFilter) => void;
};

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'expense', label: TRANSACTION_TYPE_LABEL.expense },
  { value: 'income', label: TRANSACTION_TYPE_LABEL.income },
  { value: 'saving', label: TRANSACTION_TYPE_LABEL.saving },
];

const TYPE_CHIP_ACTIVE: Record<TypeFilter, string> = {
  all: styles.typeChipActive,
  expense: styles.typeChipExpense,
  income: styles.typeChipIncome,
  saving: styles.typeChipSaving,
};

const formatMonthLabel = (date: Date) => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};

export const HistoryFilterBar = ({
  selectedMonth,
  typeFilter,
  categoryId,
  categoryOptions,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  onClearMonth,
  onTypeChange,
  onCategoryChange,
}: Props) => {
  return (
    <div className={styles.filterBar}>
      <div className={styles.typeGroup} role="group" aria-label="유형 필터">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.typeChip} ${typeFilter === option.value ? TYPE_CHIP_ACTIVE[option.value] : ''}`}
            onClick={() => onTypeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>카테고리</span>
          <CategoryFilterPopover
            key={typeFilter}
            categories={categoryOptions}
            value={categoryId}
            onChange={onCategoryChange}
          />
        </div>

        <div className={styles.monthGroup}>
          <span className={styles.filterLabel}>기간</span>
          <div className={styles.monthControls}>
            <button
              type="button"
              className={styles.monthNavButton}
              onClick={onPrevMonth}
              aria-label="이전 달"
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <p className={styles.monthLabel}>
              {selectedMonth === null
                ? '전체'
                : formatMonthLabel(selectedMonth)}
            </p>
            <button
              type="button"
              className={styles.monthNavButton}
              onClick={onNextMonth}
              disabled={!canGoNext && selectedMonth !== null}
              aria-label="다음 달"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
            <button
              type="button"
              className={`${styles.allMonthButton} ${selectedMonth === null ? styles.allMonthButtonActive : ''}`}
              onClick={onClearMonth}
            >
              전체
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
