'use client';

import Link from 'next/link';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';
import { TRANSACTION_TYPE_LABEL } from '@/shared/model';
import { formatAmount } from '@/shared/lib';

import type { HistoryTotals } from '../model/useTransactionHistory';
import styles from './history.module.css';

type Props = {
  transactions: Transaction[];
  categories: Category[];
  creatorNameById: Record<string, string>;
  totals: HistoryTotals;
  showBalance?: boolean;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const formatShortDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const TransactionList = ({
  transactions,
  categories,
  creatorNameById,
  totals,
  showBalance = false,
}: Props) => {
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const balance =
    totals.income - totals.expense - totals.saving - totals.insurance;

  const resolveName = (transaction: Transaction) => {
    const categoryName =
      transaction.categoryId === null
        ? null
        : (categoryNameById.get(transaction.categoryId) ?? null);

    return (
      transaction.name?.trim() ||
      categoryName ||
      TRANSACTION_TYPE_LABEL[transaction.type] ||
      '미분류'
    );
  };

  const resolveCategoryName = (transaction: Transaction) => {
    if (transaction.categoryId === null) {
      return '미분류';
    }
    return categoryNameById.get(transaction.categoryId) ?? '미분류';
  };

  const resolveCreatorName = (createdBy: string) => {
    return creatorNameById[createdBy] ?? '알 수 없음';
  };

  const amountClass = (type: Transaction['type']) => {
    if (type === 'income') {
      return styles.amountIncome;
    }
    if (type === 'saving') {
      return styles.amountSaving;
    }
    if (type === 'insurance') {
      return styles.amountInsurance;
    }
    return styles.amountExpense;
  };

  const sign = (type: Transaction['type']) => {
    if (type === 'income') {
      return '+';
    }
    if (type === 'saving') {
      return '';
    }
    return '-';
  };

  return (
    <div className={styles.listSection}>
      <div className={styles.totals}>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>수입</span>
          <span className={`${styles.totalValue} ${styles.amountIncome}`}>
            {formatAmount(totals.income)}
          </span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>지출</span>
          <span className={`${styles.totalValue} ${styles.amountExpense}`}>
            {formatAmount(totals.expense)}
          </span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>저축</span>
          <span className={`${styles.totalValue} ${styles.amountSaving}`}>
            {formatAmount(totals.saving)}
          </span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>보험</span>
          <span className={`${styles.totalValue} ${styles.amountInsurance}`}>
            {formatAmount(totals.insurance)}
          </span>
        </div>
        {showBalance ? (
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>잔액</span>
            <span
              className={`${styles.totalValue} ${balance < 0 ? styles.amountExpense : styles.amountIncome}`}
            >
              {formatAmount(balance)}
            </span>
          </div>
        ) : null}
      </div>

      {transactions.length === 0 ? (
        <p className={styles.empty}>조건에 맞는 거래가 없습니다.</p>
      ) : (
        <>
          <ul className={styles.listCards}>
            {transactions.map((transaction) => (
              <li key={transaction.id}>
                <Link
                  href={`/write/${transaction.id}`}
                  className={styles.cardItem}
                >
                  <span className={styles.cardDate}>
                    {formatShortDate(transaction.transactionDt)}
                  </span>
                  <span className={styles.cardName}>
                    {resolveName(transaction)}
                  </span>
                  <span
                    className={`${styles.cardAmount} ${amountClass(transaction.type)}`}
                  >
                    {sign(transaction.type)}
                    {formatAmount(transaction.amount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <table className={styles.listTable}>
            <thead>
              <tr>
                <th>날짜</th>
                <th>유형</th>
                <th>이름</th>
                <th>카테고리</th>
                <th>생성일</th>
                <th>생성자</th>
                <th className={styles.amountCol}>금액</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className={styles.tableRow}>
                  <td>
                    <Link
                      href={`/write/${transaction.id}`}
                      className={styles.tableRowLink}
                      aria-label={`${resolveName(transaction)} 수정`}
                    />
                    {formatDate(transaction.transactionDt)}
                  </td>
                  <td>{TRANSACTION_TYPE_LABEL[transaction.type]}</td>
                  <td>{resolveName(transaction)}</td>
                  <td>{resolveCategoryName(transaction)}</td>
                  <td>{formatDate(transaction.createdDt)}</td>
                  <td>{resolveCreatorName(transaction.createdBy)}</td>
                  <td
                    className={`${styles.amountCol} ${amountClass(transaction.type)}`}
                  >
                    {sign(transaction.type)}
                    {formatAmount(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};
