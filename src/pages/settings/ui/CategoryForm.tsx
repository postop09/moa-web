'use client';

import { useState, type FormEvent } from 'react';

import type { Category } from '@/entities/category';
import { useCreateCategory, useUpdateCategory } from '@/features/category';
import type { TransactionType } from '@/shared/model';

import { Modal } from './Modal';
import styles from '../settings.module.css';

type Mode = { type: 'create' } | { type: 'edit'; category: Category };

type Props = {
  householdId: string;
  mode: Mode;
  onCancel: () => void;
  onSuccess: () => void;
};

export const CategoryForm = ({
  householdId,
  mode,
  onCancel,
  onSuccess,
}: Props) => {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory(householdId);

  const [name, setName] = useState(
    mode.type === 'edit' ? mode.category.name : '',
  );
  const [type, setType] = useState<TransactionType>(
    mode.type === 'edit' ? mode.category.type : 'expense',
  );
  const [budget, setBudget] = useState(
    mode.type === 'edit' && mode.category.budget !== null
      ? String(mode.category.budget)
      : '',
  );

  const isPending = createCategory.isPending || updateCategory.isPending;
  const error = createCategory.error ?? updateCategory.error;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const parsedBudget = budget.trim() === '' ? null : Number(budget);
    if (
      parsedBudget !== null &&
      (Number.isNaN(parsedBudget) || parsedBudget < 0)
    ) {
      return;
    }

    try {
      if (mode.type === 'create') {
        await createCategory.mutateAsync({
          householdId,
          name: trimmedName,
          type,
          budget: parsedBudget,
        });
      } else {
        await updateCategory.mutateAsync({
          id: mode.category.id,
          name: trimmedName,
          type,
          budget: parsedBudget,
        });
      }

      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <Modal
      title={mode.type === 'create' ? '카테고리 추가' : '카테고리 수정'}
      onClose={onCancel}
      closeDisabled={isPending}
    >
      <form className={styles.modalBody} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="categoryName">
            이름
          </label>
          <input
            id="categoryName"
            className={styles.input}
            type="text"
            maxLength={40}
            required
            autoFocus
            value={name}
            disabled={isPending}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>유형</span>
          <div className={styles.typeRow}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="categoryType"
                value="expense"
                checked={type === 'expense'}
                disabled={isPending}
                onChange={() => setType('expense')}
              />
              지출
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="categoryType"
                value="income"
                checked={type === 'income'}
                disabled={isPending}
                onChange={() => setType('income')}
              />
              수입
            </label>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="categoryBudget">
            예산 (선택)
          </label>
          <input
            id="categoryBudget"
            className={styles.input}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="비워두면 예산 없음"
            value={budget}
            disabled={isPending}
            onChange={(event) => setBudget(event.target.value)}
          />
        </div>

        {error ? (
          <p className={styles.error}>
            {error instanceof Error
              ? error.message
              : '카테고리 저장에 실패했습니다.'}
          </p>
        ) : null}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
            disabled={isPending}
          >
            취소
          </button>
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={isPending}
          >
            {isPending ? '저장 중…' : mode.type === 'create' ? '추가' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
