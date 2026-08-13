'use client';

import type { Category } from '@/entities/category';
import { useDeleteCategory } from '@/features/category';

import { Modal } from './Modal';
import styles from '../settings.module.css';

type Props = {
  householdId: string;
  category: Category;
  onCancel: () => void;
  onSuccess: () => void;
};

export const CategoryDeleteConfirm = ({
  householdId,
  category,
  onCancel,
  onSuccess,
}: Props) => {
  const { mutateAsync, isPending, error } = useDeleteCategory(householdId);

  const handleConfirm = async () => {
    try {
      await mutateAsync(category.id);
      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <Modal title="카테고리 삭제" onClose={onCancel} closeDisabled={isPending}>
      <div className={styles.modalBody}>
        <p className={styles.confirmText}>
          <strong>{category.name}</strong> 카테고리를 삭제할까요?
        </p>
        {error ? (
          <p className={styles.error}>
            {error instanceof Error
              ? error.message
              : '카테고리 삭제에 실패했습니다.'}
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
            type="button"
            className={styles.dangerPrimaryButton}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
