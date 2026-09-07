'use client';

import dynamic from 'next/dynamic';

import { TRANSACTION_TYPE_COLOR } from '@/shared/model';
import { formatAmount, getErrorMessage } from '@/shared/lib';

import { CategoryBudgetCard } from './CategoryBudgetCard';
import { DashboardHeader } from './DashboardHeader';
import { RecentTransactionsCard } from './RecentTransactionsCard';
import { useHomeDashboard } from '../model/useHomeDashboard';
import styles from './home.module.css';

// echarts를 쓰는 카드들은 dashboard 진입 시에만 별도 청크로 불러온다(다른 라우트의 초기 번들에서 제외).
const CategoryPieCard = dynamic(
  () => import('./CategoryPieCard').then((mod) => mod.CategoryPieCard),
  { ssr: false },
);
const DailyExpenseCard = dynamic(
  () => import('./DailyExpenseCard').then((mod) => mod.DailyExpenseCard),
  { ssr: false },
);
const MetricRingCard = dynamic(
  () => import('./MetricRingCard').then((mod) => mod.MetricRingCard),
  { ssr: false },
);
const SpendingOverTimeCard = dynamic(
  () =>
    import('./SpendingOverTimeCard').then((mod) => mod.SpendingOverTimeCard),
  { ssr: false },
);
const TopSpendingsCard = dynamic(
  () => import('./TopSpendingsCard').then((mod) => mod.TopSpendingsCard),
  { ssr: false },
);

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
    dailyExpenses,
    isLoading,
    error,
  } = useHomeDashboard(householdId, selectedMonth);

  if (isLoading) {
    return <p className={styles.empty}>불러오는 중…</p>;
  }

  if (error) {
    return (
      <p className={styles.error}>
        {getErrorMessage(error, '현황을 불러오지 못했습니다.')}
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
      <DailyExpenseCard items={dailyExpenses} selectedMonth={selectedMonth} />

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
