'use client';

import { TRANSACTION_TYPE_COLOR } from '@/shared/model';
import { formatAmount } from '@/shared/lib';

import { AssetTrendCard } from './AssetTrendCard';
import { CategoryBudgetCard } from './CategoryBudgetCard';
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
  selectedMonth: Date;
};

const formatRate = (rate: number | null) => {
  if (rate === null) {
    return '—';
  }

  return `${Math.round(rate * 10) / 10}%`;
};

export const DashboardSection = ({ householdId, selectedMonth }: Props) => {
  const {
    income,
    expense,
    saving,
    insurance,
    incomeTotalBudget,
    expenseRate,
    insuranceRate,
    savingRate,
    expenseByCategory,
    categoryBudgets,
    recentTransactions,
    categories,
    monthlyExpenses,
    weeklyExpenses,
    assetTrends,
    isLoading,
    error,
  } = useHomeDashboard(householdId, selectedMonth);

  if (isLoading) {
    return <p className={styles.empty}>불러오는 중…</p>;
  }

  if (error) {
    return (
      <p className={styles.error}>
        {error instanceof Error ? error.message : '현황을 불러오지 못했습니다.'}
      </p>
    );
  }

  const incomeRingRatio =
    income > 0 ? (income / incomeTotalBudget) * 100 : null;

  return (
    <div className={styles.dashboard}>
      <DashboardHeader
        income={income}
        expense={expense}
        saving={saving}
        insurance={insurance}
      />
      <AssetTrendCard items={assetTrends} />

      <div className={styles.grid}>
        <div className={styles.column}>
          <div className={styles.kpiGrid}>
            <MetricRingCard
              label="수입"
              valueLabel={income === null ? '—' : formatAmount(income)}
              ratio={incomeRingRatio}
              color={TRANSACTION_TYPE_COLOR.income}
            />
            <MetricRingCard
              label="지출 비율"
              valueLabel={formatRate(expenseRate)}
              ratio={expenseRate}
              color={TRANSACTION_TYPE_COLOR.expense}
            />
            <MetricRingCard
              label="저축 비율"
              valueLabel={formatRate(savingRate)}
              ratio={savingRate}
              negative={savingRate !== null && savingRate < 0}
              color={TRANSACTION_TYPE_COLOR.saving}
            />
            <MetricRingCard
              label="보험 비율"
              valueLabel={formatRate(insuranceRate)}
              ratio={insuranceRate}
              color={TRANSACTION_TYPE_COLOR.insurance}
            />
            <RecentTransactionsCard
              transactions={recentTransactions}
              categories={categories}
            />
          </div>
        </div>

        <div className={styles.column}>
          <CategoryPieCard items={expenseByCategory} />
          <TopSpendingsCard items={expenseByCategory} />
        </div>

        <div className={styles.column}>
          <SpendingOverTimeCard
            weeklyItems={weeklyExpenses}
            monthlyItems={monthlyExpenses}
          />
          <CategoryBudgetCard items={categoryBudgets} />
        </div>
      </div>
    </div>
  );
};
