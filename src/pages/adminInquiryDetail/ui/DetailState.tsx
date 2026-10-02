import Link from 'next/link';

import { Button } from '@/shared/ui';

import {
  ADMIN_INQUIRIES_PATH,
  LOAD_ERROR_TEXT,
  NOT_FOUND_TEXT,
  PERMISSION_TEXT,
  THREAD_ERROR_TEXT,
} from '../config/texts';

import styles from './adminInquiryDetail.module.css';

export const DetailSkeleton = () => (
  <div className={styles.skeleton} aria-busy="true">
    <p className="srOnly">불러오는 중…</p>
    <span className={styles.skeletonBlock} aria-hidden />
    <span className={styles.skeletonBlock} aria-hidden />
  </div>
);

export const DetailNotFound = () => (
  <div className={styles.state}>
    <p className={styles.stateText}>{NOT_FOUND_TEXT}</p>
    <Link href={ADMIN_INQUIRIES_PATH} className={styles.stateLink}>
      문의 목록으로
    </Link>
  </div>
);

type ErrorProps = {
  isPermission: boolean;
  onRetry: () => void;
};

export const DetailError = ({ isPermission, onRetry }: ErrorProps) => (
  <div className={styles.state} role="alert">
    <p className={styles.stateText}>
      {isPermission ? PERMISSION_TEXT : LOAD_ERROR_TEXT}
    </p>
    <Button variant="secondary" onClick={onRetry}>
      다시 시도
    </Button>
  </div>
);

type ThreadStateProps = {
  isError: boolean;
  onRetry: () => void;
};

/** 문의 행은 있지만 메시지를 아직 못 받은 동안의 스레드 자리. */
export const ThreadState = ({ isError, onRetry }: ThreadStateProps) =>
  isError ? (
    <div className={styles.state} role="alert">
      <p className={styles.stateText}>{THREAD_ERROR_TEXT}</p>
      <Button variant="secondary" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  ) : (
    <div className={styles.skeleton} aria-busy="true">
      <p className="srOnly">대화 내용을 불러오는 중…</p>
      <span className={styles.skeletonBlock} aria-hidden />
    </div>
  );
