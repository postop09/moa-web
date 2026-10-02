import {
  getAdminStatusLabel,
  getUserStatusLabel,
} from '../config/inquiryStatus';
import type { InquiryStatus } from '../config/inquiryStatus';

import styles from './inquiryBadge.module.css';

type Props = {
  status: InquiryStatus;
  /** 'admin' 은 처리 중을 따로 보이고 답변 대기를 경고 톤으로 강조한다. 기본은 사용자 앱. */
  audience?: 'user' | 'admin';
};

const getTone = (status: InquiryStatus, audience: 'user' | 'admin') => {
  if (status === 'answered') return 'accent';
  if (audience === 'admin' && status === 'waiting') return 'warning';

  return 'neutral';
};

/** 상태 뱃지. 사용자 앱에서는 in_progress 가 '답변 대기' 로 보인다. 색만으로 구분하지 않도록 항상 텍스트를 함께 둔다. */
export const InquiryStatusBadge = ({ status, audience = 'user' }: Props) => (
  <span className={styles.statusBadge} data-tone={getTone(status, audience)}>
    {audience === 'admin'
      ? getAdminStatusLabel(status)
      : getUserStatusLabel(status)}
  </span>
);
