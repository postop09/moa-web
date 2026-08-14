'use client';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';

import { useTransactionHistory } from './model/useTransactionHistory';
import { HistoryFilterBar } from './ui/HistoryFilterBar';
import { TransactionList } from './ui/TransactionList';
import styles from './ui/history.module.css';

export const HistoryPage = () => {
  const { householdId, isLoading: householdLoading, error: householdError } =
    useCurrentHousehold();
  const {
    selectedMonth,
    typeFilter,
    categoryId,
    categoryOptions,
    categories,
    transactions,
    totals,
    creatorNameById,
    canGoNext,
    goPrevMonth,
    goNextMonth,
    clearMonthFilter,
    setTypeFilter,
    setCategoryId,
    isLoading,
    error,
  } = useTransactionHistory(householdId);

  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="거래 내역" />

      {householdLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {householdError ? (
        <p className={styles.error}>
          {householdError instanceof Error
            ? householdError.message
            : '가계부 정보를 불러오지 못했습니다.'}
        </p>
      ) : null}

      {!householdLoading && !householdId ? (
        <p className={styles.empty}>확인할 가계부를 선택해 주세요.</p>
      ) : null}

      {householdId ? (
        <>
          <HistoryFilterBar
            selectedMonth={selectedMonth}
            typeFilter={typeFilter}
            categoryId={categoryId}
            categoryOptions={categoryOptions}
            canGoNext={canGoNext}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onClearMonth={clearMonthFilter}
            onTypeChange={setTypeFilter}
            onCategoryChange={setCategoryId}
          />

          {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

          {error ? (
            <p className={styles.error}>
              {error instanceof Error
                ? error.message
                : '거래 내역을 불러오지 못했습니다.'}
            </p>
          ) : null}

          {!isLoading && !error ? (
            <TransactionList
              transactions={transactions}
              categories={categories}
              creatorNameById={creatorNameById}
              totals={totals}
              showBalance={typeFilter === 'all'}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
};
