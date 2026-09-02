import Link from 'next/link';

import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';
import { TRANSACTION_TYPE_LABEL, type TransactionType } from '@/shared/model';
import { formatAmount } from '@/shared/lib';

import styles from './home.module.css';

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

const AMOUNT_CLASS: Record<TransactionType, string> = {
  income: styles.recentIncome,
  expense: styles.recentExpense,
  saving: styles.recentSaving,
  insurance: styles.recentInsurance,
};

const AMOUNT_SIGN: Record<TransactionType, string> = {
  income: '+',
  expense: '-',
  saving: '',
  insurance: '-',
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const RecentTransactionsCard = ({ transactions, categories }: Props) => {
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

            const amountClass = AMOUNT_CLASS[transaction.type];
            const sign = AMOUNT_SIGN[transaction.type];

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
