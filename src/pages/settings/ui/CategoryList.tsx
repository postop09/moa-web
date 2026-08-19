'use client';

import type { Category } from '@/entities/category';
import { TRANSACTION_TYPE_LABEL, type TransactionType } from '@/shared/model';
import { formatAmount } from '@/shared/lib';

import styles from '../settings.module.css';

type Props = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

const TYPE_ORDER: TransactionType[] = ['expense', 'income', 'saving'];

const TYPE_TITLE_CLASS: Record<TransactionType, string> = {
  expense: styles.groupTitleExpense,
  income: styles.groupTitleIncome,
  saving: styles.groupTitleSaving,
};

const formatBudget = (budget: number | null) => {
  if (budget === null) {
    return '예산 없음';
  }

  return formatAmount(budget);
};

export const CategoryList = ({ categories, onEdit, onDelete }: Props) => {
  if (categories.length === 0) {
    return <p className={styles.empty}>등록된 카테고리가 없습니다.</p>;
  }

  const grouped = {
    expense: categories.filter((item) => item.type === 'expense'),
    income: categories.filter((item) => item.type === 'income'),
    saving: categories.filter((item) => item.type === 'saving'),
  } as const;

  return (
    <div className={styles.list}>
      {TYPE_ORDER.map((type) => {
        const items = grouped[type];
        if (items.length === 0) {
          return null;
        }

        return (
          <section key={type} className={styles.group}>
            <h3 className={`${styles.groupTitle} ${TYPE_TITLE_CLASS[type]}`}>
              {TRANSACTION_TYPE_LABEL[type]}
            </h3>
            <ul className={styles.groupList}>
              {items.map((category) => (
                <li key={category.id} className={styles.row}>
                  <div className={styles.rowBody}>
                    <span className={styles.rowName}>{category.name}</span>
                    <span className={styles.rowMeta}>
                      {formatBudget(category.budget)}
                    </span>
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => onEdit(category)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => onDelete(category)}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
