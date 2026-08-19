import type { CategoryBudget } from '@/features/transaction';
import { formatAmount } from '@/shared/lib';

import styles from './home.module.css';

type Props = {
  items: CategoryBudget[];
};

const formatBudget = (budget: number | null) => {
  if (budget === null) {
    return '미설정';
  }

  return formatAmount(budget);
};

const formatPercent = (ratio: number | null) => {
  if (ratio === null) {
    return '—';
  }

  if (!Number.isFinite(ratio)) {
    return '초과';
  }

  return `${Math.round(ratio * 1000) / 10}%`;
};

export const CategoryBudgetCard = ({ items }: Props) => {
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>지출 예산</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>지출 카테고리가 없습니다.</p>
      ) : (
        <ul className={styles.budgetList}>
          {items.map((item) => {
            const unsetOrZero = item.budget === null || item.budget === 0;
            const over =
              item.spent > 0 && (unsetOrZero || (item.ratio ?? 0) > 1);
            const width = unsetOrZero
              ? item.spent > 0
                ? 100
                : 0
              : Math.min(100, (item.ratio ?? 0) * 100);
            const percentLabel = unsetOrZero
              ? item.spent > 0
                ? '초과'
                : item.budget === null
                  ? '—'
                  : '0%'
              : formatPercent(item.ratio);

            return (
              <li key={item.id} className={styles.budgetRow}>
                <div className={styles.budgetRowHeader}>
                  <span className={styles.budgetName}>{item.name}</span>
                  <span
                    className={`${styles.budgetMeta} ${over ? styles.budgetMetaOver : ''}`}
                  >
                    {formatAmount(item.spent)} / {formatBudget(item.budget)} ·{' '}
                    {percentLabel}
                  </span>
                </div>
                <div
                  className={styles.budgetTrack}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(width)}
                  aria-label={`${item.name} 예산 사용률 ${percentLabel}`}
                >
                  <div
                    className={`${styles.budgetFill} ${over ? styles.budgetFillOver : ''}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
