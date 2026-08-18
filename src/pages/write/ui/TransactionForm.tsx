'use client';

import { useState, type FormEvent } from 'react';

import type { Transaction } from '@/entities/transaction';
import { useListCategories } from '@/features/category';
import {
  useCreateTransaction,
  useUpdateTransaction,
} from '@/features/transaction';
import { TRANSACTION_TYPE_LABEL, type TransactionType } from '@/shared/model';

import { CategoryPopover } from './CategoryPopover';
import { DatePicker } from './DatePicker';
import styles from './write.module.css';

type Mode = { type: 'create' } | { type: 'edit'; transaction: Transaction };

type Props = {
  householdId: string;
  mode: Mode;
  onSuccess: () => void;
  onDelete?: () => void;
};

const toDateInputValue = (iso: string) => {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromDateInputValue = (value: string) => {
  return new Date(`${value}T12:00:00`).toISOString();
};

const todayInputValue = () => toDateInputValue(new Date().toISOString());

const TYPE_OPTIONS: {
  value: TransactionType;
  activeClass: string;
}[] = [
  { value: 'expense', activeClass: styles.typeSegmentExpense },
  { value: 'income', activeClass: styles.typeSegmentIncome },
  { value: 'saving', activeClass: styles.typeSegmentSaving },
];

export const TransactionForm = ({
  householdId,
  mode,
  onSuccess,
  onDelete,
}: Props) => {
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction(householdId);
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useListCategories(householdId);

  const [type, setType] = useState<TransactionType>(
    mode.type === 'edit' ? mode.transaction.type : 'expense',
  );
  const [amount, setAmount] = useState(
    mode.type === 'edit' ? String(mode.transaction.amount) : '',
  );
  const [transactionDate, setTransactionDate] = useState(
    mode.type === 'edit'
      ? toDateInputValue(mode.transaction.transactionDt)
      : todayInputValue(),
  );
  const [categoryId, setCategoryId] = useState(
    mode.type === 'edit' && mode.transaction.categoryId !== null
      ? String(mode.transaction.categoryId)
      : '',
  );
  const [name, setName] = useState(
    mode.type === 'edit' ? (mode.transaction.name ?? '') : '',
  );
  const [memo, setMemo] = useState(
    mode.type === 'edit' ? (mode.transaction.memo ?? '') : '',
  );
  const [isRecurring, setIsRecurring] = useState(
    mode.type === 'edit' ? Boolean(mode.transaction.isRecurring) : false,
  );

  const isPending = createTransaction.isPending || updateTransaction.isPending;
  const error = createTransaction.error ?? updateTransaction.error;
  const filteredCategories = categories.filter((item) => item.type === type);
  const disabled = isPending || isCategoriesLoading;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategoryId('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (!transactionDate) {
      return;
    }

    const payload = {
      type,
      amount: Math.trunc(parsedAmount),
      transactionDt: fromDateInputValue(transactionDate),
      categoryId: categoryId === '' ? null : Number(categoryId),
      name: name.trim() === '' ? null : name.trim(),
      memo: memo.trim() === '' ? null : memo.trim(),
      isRecurring,
    };

    try {
      if (mode.type === 'create') {
        await createTransaction.mutateAsync({
          householdId,
          ...payload,
        });
      } else {
        await updateTransaction.mutateAsync({
          id: mode.transaction.id,
          ...payload,
        });
      }

      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <span className={styles.label} id="transactionTypeLabel">
          유형
        </span>
        <div
          className={styles.typeSegmentGroup}
          role="radiogroup"
          aria-labelledby="transactionTypeLabel"
        >
          {TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`${styles.typeSegment} ${
                type === option.value ? option.activeClass : ''
              }`}
            >
              <input
                className={styles.visuallyHidden}
                type="radio"
                name="transactionType"
                value={option.value}
                checked={type === option.value}
                disabled={disabled}
                onChange={() => handleTypeChange(option.value)}
              />
              {TRANSACTION_TYPE_LABEL[option.value]}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="transactionAmount">
          금액
        </label>
        <input
          id="transactionAmount"
          className={styles.input}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          value={amount}
          disabled={disabled}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="transactionDate">
          날짜
        </label>
        <DatePicker
          id="transactionDate"
          required
          value={transactionDate}
          disabled={disabled}
          onChange={setTransactionDate}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label} id="transactionCategoryLabel">
          카테고리 (선택)
        </span>
        <CategoryPopover
          categories={filteredCategories}
          value={categoryId}
          disabled={disabled}
          resetKey={type}
          onChange={setCategoryId}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="transactionName">
          이름 (선택)
        </label>
        <input
          id="transactionName"
          className={styles.input}
          type="text"
          maxLength={80}
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="transactionMemo">
          메모 (선택)
        </label>
        <input
          id="transactionMemo"
          className={styles.input}
          type="text"
          maxLength={200}
          value={memo}
          disabled={disabled}
          onChange={(event) => setMemo(event.target.value)}
        />
      </div>

      <label className={styles.toggleRow}>
        <span className={styles.toggleLabel}>반복 거래</span>
        <input
          className={styles.visuallyHidden}
          type="checkbox"
          role="switch"
          checked={isRecurring}
          disabled={disabled}
          aria-checked={isRecurring}
          onChange={(event) => setIsRecurring(event.target.checked)}
        />
        <span className={styles.switchTrack} aria-hidden>
          <span className={styles.switchThumb} />
        </span>
      </label>

      {error ? (
        <p className={styles.error}>
          {error instanceof Error ? error.message : '거래 저장에 실패했습니다.'}
        </p>
      ) : null}
      <div className={styles.buttonGroup}>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={disabled}
        >
          {isPending ? '저장 중…' : mode.type === 'create' ? '작성' : '저장'}
        </button>
        {onDelete ? (
          <button
            type="button"
            className={styles.dangerPrimaryButton}
            onClick={onDelete}
            disabled={disabled}
          >
            삭제
          </button>
        ) : null}
      </div>
    </form>
  );
};
