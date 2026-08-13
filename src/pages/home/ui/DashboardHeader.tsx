import styles from './home.module.css';

type Props = {
  budgetTotal: number | null;
  income: number;
  expense: number;
};

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

export const DashboardHeader = ({ budgetTotal, income, expense }: Props) => {
  const maxAmount = Math.max(income, expense, 1);
  const incomeWidth = `${Math.min(100, (income / maxAmount) * 100)}%`;
  const expenseWidth = `${Math.min(100, (expense / maxAmount) * 100)}%`;

  return (
    <section className={styles.header}>
      <div className={styles.budgetBlock}>
        <p className={styles.budgetLabel}>예산</p>
        <p className={styles.budgetValue}>
          {budgetTotal === null ? '—' : formatAmount(budgetTotal)}
        </p>
      </div>

      <div className={styles.bars}>
        <div className={styles.barRow}>
          <div className={styles.barMeta}>
            <p className={styles.barLabel}>수입</p>
            <p className={styles.barAmount}>{formatAmount(income)}</p>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: incomeWidth }} />
          </div>
        </div>
        <div className={styles.barRow}>
          <div className={styles.barMeta}>
            <p className={styles.barLabel}>지출</p>
            <p className={styles.barAmount}>{formatAmount(expense)}</p>
          </div>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${styles.barFillMuted}`}
              style={{ width: expenseWidth }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
