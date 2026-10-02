import Link from 'next/link';

import {
  InquiryStatusBadge,
  UnreadReplyBadge,
  formatInquiryListDate,
  getInquiryCategoryLabel,
} from '@/entities/inquiry';
import type { Inquiry } from '@/entities/inquiry';

import styles from './myInquiries.module.css';

type Props = {
  inquiry: Inquiry;
};

export const InquiryCard = ({ inquiry }: Props) => (
  <Link
    href={`/support/inquiries/${inquiry.id}`}
    className={styles.card}
    data-unread={inquiry.hasUnreadReply ? 'true' : undefined}
    data-status={inquiry.status}
  >
    <span className={styles.cardBadges}>
      <InquiryStatusBadge status={inquiry.status} />
      {inquiry.hasUnreadReply ? <UnreadReplyBadge /> : null}
    </span>
    <span className={styles.cardTitle}>{inquiry.title}</span>
    <span className={styles.cardMeta}>
      {`${getInquiryCategoryLabel(inquiry.category)} · ${formatInquiryListDate(inquiry.createdAt)}`}
    </span>
  </Link>
);
