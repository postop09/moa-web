import Link from 'next/link';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';
import { TRANSACTION_TYPE_LABEL } from '@/shared/model';

import styles from './home.module.css';

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const RecentTransactionsCard = ({
  transactions,
  categories,
}: Props) => {
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>최근 내역</h3>
      {transactions.length === 0 ? (
        <p className={styles.empty}>이번 달 거래가 없습니다.</p>
      ) : (
        <ul className={styles.recentList}>
          {transactions.map((transaction) => {
            const categoryName =
              transaction.categoryId === null
                ? null
                : (categoryNameById.get(transaction.categoryId) ?? null);

            const name =
              transaction.name?.trim() ||
              categoryName ||
              TRANSACTION_TYPE_LABEL[transaction.type] ||
              '미분류';

            const amountClass =
              transaction.type === 'income'
                ? styles.recentIncome
                : transaction.type === 'saving'
                  ? styles.recentSaving
                  : styles.recentExpense;

            const sign =
              transaction.type === 'income'
                ? '+'
                : transaction.type === 'saving'
                  ? ''
                  : '-';

            return (
              <li key={transaction.id}>
                <Link
                  href={`/write/${transaction.id}`}
                  className={styles.recentItem}
                >
                  <span className={styles.recentMeta}>
                    {formatDate(transaction.transactionDt)}
                  </span>
                  <span className={styles.recentName}>{name}</span>
                  <span className={`${styles.recentAmount} ${amountClass}`}>
                    {sign}
                    {formatAmount(transaction.amount)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
