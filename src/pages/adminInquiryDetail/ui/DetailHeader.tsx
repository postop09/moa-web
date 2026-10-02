import Link from 'next/link';
import type { Ref } from 'react';

import type { AdminInquiry } from '@/entities/admin';
import { formatWaitingTime } from '@/entities/admin';
import {
  InquiryStatusBadge,
  formatInquiryDetailDate,
  INQUIRY_CATEGORY_LABELS,
  getWaitingHours,
  isOverdue,
} from '@/entities/inquiry';

import {
  ADMIN_INQUIRIES_PATH,
  OPEN_FAILURE_TEXT,
  PAGE_TITLE,
  PEEK_HINT_TEXT,
  PEEK_NOTE_TEXT,
} from '../config/texts';
import { getEmailName } from '../lib/getEmailName';

import styles from './adminInquiryDetail.module.css';

type Props = {
  /** 불러오기 전에는 없다. */
  inquiry: AdminInquiry | null;
  /** 미리보기로 열었다. 답변 대기 문의에만 안내한다. */
  peek: boolean;
  /** 확인 전이거나 확인하지 못하면 null. */
  currentUserId: string | null;
  /** 열기(처리 중으로 바꾸고 담당 지정)에 실패했다. */
  isOpenFailed: boolean;
  titleRef: Ref<HTMLHeadingElement>;
  onBack: () => void;
};

const isPending = (status: AdminInquiry['status']) =>
  status === 'waiting' || status === 'in_progress';

const getAssigneeText = (
  inquiry: AdminInquiry,
  currentUserId: string | null,
) => {
  if (inquiry.assigneeId === null) return '담당 미지정';

  return inquiry.assigneeId === currentUserId
    ? '담당 나'
    : `담당 ${getEmailName(inquiry.assigneeEmail)}`;
};

type MetaProps = { inquiry: AdminInquiry; currentUserId: string | null };

const InquiryMeta = ({ inquiry, currentUserId }: MetaProps) => {
  const isOpenInquiry = isPending(inquiry.status);
  const hours = getWaitingHours(inquiry.waitingSince);
  const waiting = isOpenInquiry ? ` · 대기 ${formatWaitingTime(hours)}` : '';

  return (
    <p className={styles.meta}>
      <InquiryStatusBadge status={inquiry.status} audience="admin" />
      <span>{`접수 ${formatInquiryDetailDate(inquiry.createdAt)}${waiting}`}</span>
      {isOpenInquiry && isOverdue(hours) ? (
        <span className={styles.overdue} data-overdue="true">
          24시간 초과
        </span>
      ) : null}
      <span>{getAssigneeText(inquiry, currentUserId)}</span>
      <span
        className={styles.categoryChip}
        data-uncategorized={inquiry.category === null ? 'true' : undefined}
      >
        {inquiry.category
          ? INQUIRY_CATEGORY_LABELS[inquiry.category]
          : '미분류'}
      </span>
    </p>
  );
};

export const DetailHeader = ({
  inquiry,
  peek,
  currentUserId,
  isOpenFailed,
  titleRef,
  onBack,
}: Props) => {
  const showPeekNotes =
    inquiry !== null &&
    peek &&
    inquiry.status === 'waiting' &&
    inquiry.assigneeId === null;

  return (
    <header className={styles.header}>
      <div className={styles.crumbs}>
        <nav aria-label="현재 위치">
          <Link href={ADMIN_INQUIRIES_PATH} className={styles.crumbLink}>
            문의 관리
          </Link>
          <span aria-hidden> ›</span>
        </nav>
        <button type="button" className={styles.textButton} onClick={onBack}>
          목록으로
        </button>
      </div>
      <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
        {inquiry ? inquiry.title : PAGE_TITLE}
      </h1>
      {inquiry ? (
        <InquiryMeta inquiry={inquiry} currentUserId={currentUserId} />
      ) : null}
      {showPeekNotes ? (
        <>
          <p className={styles.peekNote}>{PEEK_NOTE_TEXT}</p>
          <p className={styles.peekNote}>{PEEK_HINT_TEXT}</p>
        </>
      ) : null}
      {isOpenFailed ? (
        <p className={styles.peekNote}>{OPEN_FAILURE_TEXT}</p>
      ) : null}
    </header>
  );
};
