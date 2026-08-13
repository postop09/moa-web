'use client';

import { CategoryPieCard } from './CategoryPieCard';
import { DashboardHeader } from './DashboardHeader';
import { MetricRingCard } from './MetricRingCard';
import { RecentTransactionsCard } from './RecentTransactionsCard';
import { SpendingOverTimeCard } from './SpendingOverTimeCard';
import { TopSpendingsCard } from './TopSpendingsCard';
import { useHomeDashboard } from '../model/useHomeDashboard';
import styles from './home.module.css';

type Props = {
  householdId: string;
};

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

const formatRate = (rate: number | null) => {
  if (rate === null) {
    return '—';
  }

  return `${Math.round(rate * 10) / 10}%`;
};

export const DashboardSection = ({ householdId }: Props) => {
  const {
    income,
    expense,
    saving,
    savingRate,
    budgetTotal,
    budgetRemaining,
    expenseByCategory,
    recentTransactions,
    monthlyExpenses,
    isLoading,
    error,
  } = useHomeDashboard(householdId);

  if (isLoading) {
    return <p className={styles.empty}>불러오는 중…</p>;
  }

  if (error) {
    return (
      <p className={styles.error}>
        {error instanceof Error
          ? error.message
          : '현황을 불러오지 못했습니다.'}
      </p>
    );
  }

  const expenseRatio =
    budgetTotal && budgetTotal > 0
      ? (expense / budgetTotal) * 100
      : income > 0
        ? (expense / income) * 100
        : null;

  const remainingRatio =
    budgetTotal && budgetTotal > 0 && budgetRemaining !== null
      ? (Math.max(0, budgetRemaining) / budgetTotal) * 100
      : null;

  const savingRingRatio =
    savingRate === null ? null : Math.max(0, Math.min(100, savingRate));

  return (
    <div className={styles.dashboard}>
      <DashboardHeader income={income} expense={expense} saving={saving} />

      <div className={styles.grid}>
        <div className={styles.column}>
          <div className={styles.kpiGrid}>
            <MetricRingCard
              label="저축"
              valueLabel={formatAmount(saving)}
              ratio={savingRingRatio}
              negative={saving < 0}
            />
            <MetricRingCard
              label="지출"
              valueLabel={formatAmount(expense)}
              ratio={expenseRatio}
            />
            <MetricRingCard
              label="예산 잔여"
              valueLabel={
                budgetRemaining === null ? '—' : formatAmount(budgetRemaining)
              }
              ratio={remainingRatio}
              negative={budgetRemaining !== null && budgetRemaining < 0}
            />
            <MetricRingCard
              label="저축률"
              valueLabel={formatRate(savingRate)}
              ratio={savingRingRatio}
              negative={savingRate !== null && savingRate < 0}
            />
          </div>
        </div>

        <div className={styles.column}>
          <CategoryPieCard items={expenseByCategory} />
          <RecentTransactionsCard transactions={recentTransactions} />
        </div>

        <div className={styles.column}>
          <SpendingOverTimeCard items={monthlyExpenses} />
          <TopSpendingsCard items={expenseByCategory} />
        </div>
      </div>
    </div>
  );
};
