'use client';

import { useState, type FormEvent } from 'react';

import type { ScheduleCategory } from '@/entities/scheduleCategory';
import {
  useCreateScheduleCategory,
  useUpdateScheduleCategory,
} from '@/features/scheduleCategory';
import { Modal } from '@/shared/ui';

import { CATEGORY_COLORS } from '../config/authorColors';
import styles from './calendar.module.css';

type Mode = { type: 'create' } | { type: 'edit'; category: ScheduleCategory };

type Props = {
  householdId: string;
  mode: Mode;
  onCancel: () => void;
  onSuccess: (category: ScheduleCategory) => void;
};

export const ScheduleCategoryForm = ({
  householdId,
  mode,
  onCancel,
  onSuccess,
}: Props) => {
  const createCategory = useCreateScheduleCategory();
  const updateCategory = useUpdateScheduleCategory(householdId);

  const [name, setName] = useState(
    mode.type === 'edit' ? mode.category.name : '',
  );
  const [color, setColor] = useState(
    mode.type === 'edit'
      ? mode.category.color
      : (CATEGORY_COLORS[0] ?? '#2563eb'),
  );

  const isPending = createCategory.isPending || updateCategory.isPending;
  const error = createCategory.error ?? updateCategory.error;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    try {
      if (mode.type === 'create') {
        const category = await createCategory.mutateAsync({
          householdId,
          name: trimmedName,
          color,
        });
        onSuccess(category);
        return;
      }

      const category = await updateCategory.mutateAsync({
        id: mode.category.id,
        name: trimmedName,
        color,
      });
      onSuccess(category);
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <Modal
      title={mode.type === 'create' ? '카테고리 추가' : '카테고리 수정'}
      onClose={onCancel}
      closeDisabled={isPending}
      elevated
    >
      <form className={styles.modalBody} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="scheduleCategoryName">
            이름
          </label>
          <input
            id="scheduleCategoryName"
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
          <span className={styles.label} id="scheduleCategoryColorLabel">
            색상
          </span>
          <div
            className={styles.colorSwatchGroup}
            role="radiogroup"
            aria-labelledby="scheduleCategoryColorLabel"
          >
            {CATEGORY_COLORS.map((option) => {
              const isActive = option === color;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={option}
                  className={`${styles.colorSwatch} ${isActive ? styles.colorSwatchActive : ''}`}
                  style={{ background: option }}
                  disabled={isPending}
                  onClick={() => setColor(option)}
                />
              );
            })}
          </div>
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
