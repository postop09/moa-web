import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { UnreadReplyBadge } from '@/entities/inquiry';

import styles from './support.module.css';

type Props = {
  unreadCount: number;
};

export const MyInquiriesLink = ({ unreadCount }: Props) => {
  return (
    <Link href="/support/inquiries" className={styles.inquiriesLink}>
      <span className={styles.inquiriesLabel}>내 문의 내역</span>
      {unreadCount > 0 ? <UnreadReplyBadge count={unreadCount} /> : null}
      <ChevronRight size={20} strokeWidth={2} aria-hidden />
    </Link>
  );
};
