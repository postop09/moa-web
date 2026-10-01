import Link from 'next/link';
import type { Ref } from 'react';

import type { InquiryStatus } from '@/entities/inquiry';
import { Button } from '@/shared/ui';

import { NEW_INQUIRY_PATH } from '../config/texts';

import styles from './inquiryDetail.module.css';

type Props = {
  inquiryId: string;
  /** 종결 처리 중이거나 방금 종결한 경우를 반영한 화면상 상태. */
  status: InquiryStatus;
  newInquiryRef: Ref<HTMLAnchorElement>;
  closeRef: Ref<HTMLButtonElement>;
  onClose: () => void;
};

/** 답변 대기·처리 중에는 할 수 있는 일이 없어 바를 그리지 않는다. */
export const BottomBar = ({
  inquiryId,
  status,
  newInquiryRef,
  closeRef,
  onClose,
}: Props) => {
  if (status === 'closed') {
    return (
      <div className={styles.bar}>
        <Button
          as={Link}
          ref={newInquiryRef}
          href={NEW_INQUIRY_PATH}
          fullWidth
          className={styles.barButton}
        >
          새 문의하기
        </Button>
      </div>
    );
  }

  if (status !== 'answered') return null;

  return (
    <div className={styles.bar}>
      <div className={styles.barActions}>
        <Button
          as={Link}
          href={`${NEW_INQUIRY_PATH}?followUp=${inquiryId}`}
          variant="secondary"
          fullWidth
          className={styles.barButton}
        >
          추가 문의
        </Button>
        <Button
          ref={closeRef}
          fullWidth
          className={styles.barButton}
          onClick={onClose}
        >
          해결됐어요
        </Button>
      </div>
    </div>
  );
};
