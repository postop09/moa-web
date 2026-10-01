import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import styles from './support.module.css';

type Props = {
  unreadCount: number;
};

export const MyInquiriesLink = ({ unreadCount }: Props) => {
  return (
    <Link href="/support/inquiries" className={styles.inquiriesLink}>
      <span className={styles.inquiriesLabel}>내 문의 내역</span>
      {unreadCount > 0 ? (
        <span className={styles.newBadge}>새 답변 {unreadCount}</span>
      ) : null}
      <ChevronRight size={20} strokeWidth={2} aria-hidden />
    </Link>
  );
};
