'use client';

import Link from 'next/link';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';
import { TRANSACTION_TYPE_LABEL } from '@/shared/model';

import styles from './history.module.css';

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const formatShortDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const TransactionList = ({ transactions, categories }: Props) => {
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );

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

  const amountClass = (type: Transaction['type']) => {
    if (type === 'income') {
      return styles.amountIncome;
    }
    if (type === 'saving') {
      return styles.amountSaving;
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

  if (transactions.length === 0) {
    return <p className={styles.empty}>조건에 맞는 거래가 없습니다.</p>;
  }

  return (
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
              <span className={styles.cardName}>{resolveName(transaction)}</span>
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
            <th className={styles.amountCol}>금액</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <Link
                  href={`/write/${transaction.id}`}
                  className={styles.tableLink}
                >
                  {formatDate(transaction.transactionDt)}
                </Link>
              </td>
              <td>
                <Link
                  href={`/write/${transaction.id}`}
                  className={styles.tableLink}
                >
                  {TRANSACTION_TYPE_LABEL[transaction.type]}
                </Link>
              </td>
              <td>
                <Link
                  href={`/write/${transaction.id}`}
                  className={styles.tableLink}
                >
                  {resolveName(transaction)}
                </Link>
              </td>
              <td>
                <Link
                  href={`/write/${transaction.id}`}
                  className={styles.tableLink}
                >
                  {resolveCategoryName(transaction)}
                </Link>
              </td>
              <td className={styles.amountCol}>
                <Link
                  href={`/write/${transaction.id}`}
                  className={`${styles.tableLink} ${amountClass(transaction.type)}`}
                >
                  {sign(transaction.type)}
                  {formatAmount(transaction.amount)}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
