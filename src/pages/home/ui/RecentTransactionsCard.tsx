import Link from 'next/link';

import type { Transaction } from '@/entities/transaction';

import styles from './home.module.css';

type Props = {
  transactions: Transaction[];
};

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const RecentTransactionsCard = ({ transactions }: Props) => {
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>최근 내역</h3>
      {transactions.length === 0 ? (
        <p className={styles.empty}>이번 달 거래가 없습니다.</p>
      ) : (
        <ul className={styles.recentList}>
          {transactions.map((transaction) => {
            const name =
              transaction.name?.trim() ||
              (transaction.type === 'income' ? '수입' : '지출');

            return (
              <li key={transaction.id}>
                <Link
                  href={`/write/${transaction.id}`}
                  className={styles.recentItem}
                >
                  <div className={styles.recentBody}>
                    <span className={styles.recentName}>{name}</span>
                    <span className={styles.recentMeta}>
                      {formatDate(transaction.transactionDt)}
                    </span>
                  </div>
                  <span
                    className={`${styles.recentAmount} ${transaction.type === 'income' ? styles.recentIncome : ''}`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
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
