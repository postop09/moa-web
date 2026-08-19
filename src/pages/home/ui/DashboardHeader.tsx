import { formatAmount } from '@/shared/lib';

import styles from './home.module.css';

type Props = {
  income: number;
  expense: number;
  saving: number;
};

export const DashboardHeader = ({ income, expense, saving }: Props) => {
  const balance = income - expense - saving;
  const hasIncome = income > 0;
  const expenseShare = hasIncome ? Math.min(100, (expense / income) * 100) : 0;
  const savingShare = hasIncome
    ? Math.max(0, Math.min(100 - expenseShare, (saving / income) * 100))
    : 0;

  return (
    <section className={styles.header}>
      <div className={styles.budgetBlock}>
        <p className={styles.budgetLabel}>잔액 (수입 - 지출 - 저축)</p>
        <p
          className={`${styles.budgetValue} ${balance < 0 ? styles.budgetNegative : styles.budgetPositive}`}
        >
          {formatAmount(balance)}
        </p>
      </div>

      <div className={styles.stackBarBlock}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span
              className={`${styles.legendDot} ${styles.legendDotIncome}`}
              aria-hidden
            />
            수입 {formatAmount(income)}
          </span>
          <span className={styles.legendItem}>
            <span
              className={`${styles.legendDot} ${styles.legendDotExpense}`}
              aria-hidden
            />
            지출 {formatAmount(expense)}
          </span>
          <span className={styles.legendItem}>
            <span
              className={`${styles.legendDot} ${styles.legendDotSaving}`}
              aria-hidden
            />
            저축 {formatAmount(saving)}
          </span>
        </div>

        <div
          className={styles.stackBarTrack}
          role="img"
          aria-label={`수입 ${formatAmount(income)}, 지출 ${formatAmount(expense)}, 저축 ${formatAmount(saving)}`}
        >
          {hasIncome ? (
            <>
              <div
                className={styles.barFillExpense}
                style={{ width: `${expenseShare}%` }}
              />
              <div
                className={styles.barFillSaving}
                style={{ width: `${savingShare}%` }}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};
