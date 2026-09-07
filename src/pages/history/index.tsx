'use client';

import {
  HouseholdGuard,
  HouseholdPageTitle,
  useCurrentHousehold,
} from '@/features/household';
import { getErrorMessage } from '@/shared/lib';

import { useTransactionHistory } from './model/useTransactionHistory';
import { HistoryFilterBar } from './ui/HistoryFilterBar';
import { TransactionList } from './ui/TransactionList';
import styles from './ui/history.module.css';

export const HistoryPage = () => {
  const { householdId } = useCurrentHousehold();
  const {
    selectedMonth,
    typeFilter,
    categoryId,
    categoryOptions,
    categories,
    transactions,
    totals,
    loadedCount,
    creatorNameById,
    canGoNext,
    goPrevMonth,
    goNextMonth,
    clearMonthFilter,
    setTypeFilter,
    setCategoryId,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
    retry,
    isLoading,
    error,
  } = useTransactionHistory(householdId);

  const isFirstPageError = Boolean(error) && transactions.length === 0;

  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="거래 내역" />

      <HouseholdGuard>
        {() => (
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

            {!isLoading && isFirstPageError ? (
              <div className={styles.errorCard} role="alert">
                <p className={styles.errorCardText}>
                  {getErrorMessage(error, '거래 내역을 불러오지 못했습니다.')}
                </p>
                <button
                  type="button"
                  className={styles.loadMoreButton}
                  onClick={retry}
                >
                  다시 시도
                </button>
              </div>
            ) : null}

            {!isLoading && !isFirstPageError ? (
              <TransactionList
                transactions={transactions}
                categories={categories}
                creatorNameById={creatorNameById}
                totals={totals}
                selectedMonth={selectedMonth}
                typeFilter={typeFilter}
                categoryId={categoryId}
                loadedCount={loadedCount}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                isFetchNextPageError={isFetchNextPageError}
                onLoadMore={fetchNextPage}
              />
            ) : null}
          </>
        )}
      </HouseholdGuard>
    </main>
  );
};
