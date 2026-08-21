'use client';

import { formatAmount } from '@/shared/lib';

import type { LedgerEvent, LedgerStoryState } from '../config/ledgerStory';
import { useCountUp } from '../model/useCountUp';
import styles from './welcome.module.css';

type Props = {
  state: LedgerStoryState;
};

const formatSignedAmount = (event: LedgerEvent) => {
  const amount = formatAmount(event.amount);

  if (event.type === 'expense') {
    return `-${amount}`;
  }

  return `+${amount}`;
};

const amountClassName = (type: LedgerEvent['type']) => {
  if (type === 'income') {
    return styles.txIncome;
  }

  if (type === 'saving') {
    return styles.txSaving;
  }

  return styles.txExpense;
};

export const LedgerPreview = ({ state }: Props) => {
  const { events, income, expense, saving, balance, showBudgetViz } = state;
  const animatedBalance = useCountUp(balance);
  const hasIncome = income > 0;
  const expenseShare = hasIncome ? Math.min(100, (expense / income) * 100) : 0;
  const savingShare = hasIncome
    ? Math.max(0, Math.min(100 - expenseShare, (saving / income) * 100))
    : 0;
  const remainShare = hasIncome
    ? Math.max(0, 100 - expenseShare - savingShare)
    : 0;
  const remainRatio = hasIncome ? (balance / income) * 100 : 0;

  return (
    <div className={styles.phoneFrame} aria-live="polite">
      <div className={styles.phoneChrome}>
        <span className={styles.phoneNotch} />
      </div>
      <div className={styles.phoneScreen}>
        <p className={styles.previewLabel}>잔액 (수입 - 지출 - 저축)</p>
        <p
          className={`${styles.previewBalance} ${
            balance < 0 ? styles.budgetNegative : styles.budgetPositive
          }`}
        >
          {formatAmount(animatedBalance)}
        </p>

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

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotIncome}`} />
            수입 {formatAmount(income)}
          </span>
          <span className={styles.legendItem}>
            <span
              className={`${styles.legendDot} ${styles.legendDotExpense}`}
            />
            지출 {formatAmount(expense)}
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotSaving}`} />
            저축 {formatAmount(saving)}
          </span>
        </div>

        {showBudgetViz ? (
          <div className={styles.remainViz}>
            <div
              className={styles.remainRing}
              style={{
                background: `conic-gradient(var(--color-income) 0 ${remainRatio}%, var(--band-border, var(--color-border)) ${remainRatio}% 100%)`,
              }}
              role="img"
              aria-label={`남은 예산 비율 ${Math.round(remainShare)}%`}
            >
              <div className={styles.remainRingInner}>
                <span className={styles.remainRingValue}>
                  {Math.round(remainShare)}%
                </span>
                <span className={styles.remainRingLabel}>남음</span>
              </div>
            </div>
            <p className={styles.remainCaption}>
              이번 달 남은 예산 {formatAmount(balance)}
            </p>
          </div>
        ) : (
          <ul className={styles.txList}>
            {events.length === 0 ? (
              <li className={styles.txEmpty}>아직 거래가 없습니다</li>
            ) : (
              events.map((event) => (
                <li key={event.id} className={styles.txItem}>
                  <span className={styles.txName}>{event.name}</span>
                  <span className={amountClassName(event.type)}>
                    {formatSignedAmount(event)}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
