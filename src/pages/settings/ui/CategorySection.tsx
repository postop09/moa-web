'use client';

import { useCallback, useState } from 'react';

import type { Category } from '@/entities/category';
import { useListCategories } from '@/features/category';

import { CategoryDeleteConfirm } from './CategoryDeleteConfirm';
import { CategoryForm } from './CategoryForm';
import { CategoryList } from './CategoryList';
import styles from '../settings.module.css';

type Panel =
  | { type: 'idle' }
  | { type: 'create' }
  | { type: 'edit'; category: Category }
  | { type: 'delete'; category: Category };

type Props = {
  householdId: string;
};

export const CategorySection = ({ householdId }: Props) => {
  const { data, isLoading, error } = useListCategories(householdId);
  const [panel, setPanel] = useState<Panel>({ type: 'idle' });

  const closePanel = useCallback(() => {
    setPanel({ type: 'idle' });
  }, []);

  const categories = data ?? [];

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>카테고리</h2>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setPanel({ type: 'create' })}
        >
          추가
        </button>
      </header>

      {panel.type === 'create' ? (
        <CategoryForm
          key="create"
          householdId={householdId}
          mode={{ type: 'create' }}
          onCancel={closePanel}
          onSuccess={closePanel}
        />
      ) : null}

      {panel.type === 'edit' ? (
        <CategoryForm
          key={`edit-${panel.category.id}`}
          householdId={householdId}
          mode={{ type: 'edit', category: panel.category }}
          onCancel={closePanel}
          onSuccess={closePanel}
        />
      ) : null}

      {panel.type === 'delete' ? (
        <CategoryDeleteConfirm
          householdId={householdId}
          category={panel.category}
          onCancel={closePanel}
          onSuccess={closePanel}
        />
      ) : null}

      {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {error ? (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : '카테고리 목록을 불러오지 못했습니다.'}
        </p>
      ) : null}

      {!isLoading && !error ? (
        <CategoryList
          categories={categories}
          onEdit={(category) => setPanel({ type: 'edit', category })}
          onDelete={(category) => setPanel({ type: 'delete', category })}
        />
      ) : null}
    </section>
  );
};
