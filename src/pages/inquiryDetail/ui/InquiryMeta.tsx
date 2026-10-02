import {
  InquiryStatusBadge,
  formatInquiryDetailDate,
  getInquiryCategoryLabel,
} from '@/entities/inquiry';
import type { Inquiry, InquiryStatus } from '@/entities/inquiry';

import styles from './inquiryDetail.module.css';

type Props = {
  inquiry: Inquiry;
  status: InquiryStatus;
};

export const InquiryMeta = ({ inquiry, status }: Props) => (
  <div className={styles.meta}>
    <InquiryStatusBadge status={status} />
    <span className={styles.metaText}>
      {`${getInquiryCategoryLabel(inquiry.category)} · ${formatInquiryDetailDate(inquiry.createdAt)}`}
    </span>
  </div>
);
