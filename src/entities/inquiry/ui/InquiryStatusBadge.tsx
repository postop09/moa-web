import { getUserStatusLabel } from '../config/inquiryStatus';
import type { InquiryStatus } from '../config/inquiryStatus';

import styles from './inquiryBadge.module.css';

type Props = {
  status: InquiryStatus;
};

/** 사용자 앱용 상태 뱃지. in_progress 는 '답변 대기' 로 보인다. 색만으로 구분하지 않도록 항상 텍스트를 함께 둔다. */
export const InquiryStatusBadge = ({ status }: Props) => {
  const tone = status === 'answered' ? 'accent' : 'neutral';

  return (
    <span className={styles.statusBadge} data-tone={tone}>
      {getUserStatusLabel(status)}
    </span>
  );
};
