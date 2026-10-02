'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

import { formatWaitingTime } from '@/entities/admin';
import type { AdminInquiryListItem } from '@/entities/admin';
import {
  INQUIRY_CATEGORY_LABELS,
  InquiryStatusBadge,
  getWaitingHours,
  isOverdue,
} from '@/entities/inquiry';

import { getAssigneeName } from '../lib/getAssigneeName';
import styles from './adminInquiries.module.css';

type Props = {
  item: AdminInquiryListItem;
};

export const InquiryRow = ({ item }: Props) => {
  const router = useRouter();
  const href = `/admin/inquiries/${item.id}`;
  const isPending = item.status === 'waiting' || item.status === 'in_progress';
  const hours = isPending ? getWaitingHours(item.waitingSince) : null;
  const overdue = hours !== null && isOverdue(hours);
  const uncategorized = item.category === null;

  // 행 전체를 눌러도 이동하되, 링크를 직접 누른 경우는 링크(새 탭 열기 포함)에 맡긴다.
  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as HTMLElement).closest('a')) return;
    // 새 탭 열기(Ctrl/Cmd/Shift/가운데 버튼)와 텍스트 드래그 선택은 이동으로 보지 않는다.
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    if (window.getSelection()?.toString()) return;

    router.push(href);
  };

  return (
    // 키보드 사용자는 제목 링크로 이동하므로 행에는 키 핸들러를 두지 않는다.
    <tr
      className={styles.row}
      data-overdue={overdue || undefined}
      data-uncategorized={uncategorized || undefined}
      onClick={handleRowClick}
    >
      <td className={styles.td}>
        <InquiryStatusBadge status={item.status} audience="admin" />
      </td>
      <td className={styles.td}>
        {item.category ? (
          INQUIRY_CATEGORY_LABELS[item.category]
        ) : (
          <span className={styles.uncategorized}>미분류</span>
        )}
      </td>
      <td className={`${styles.td} ${styles.titleCell}`}>
        <Link href={href} className={styles.titleLink} title={item.title}>
          {item.title}
        </Link>
      </td>
      <td className={`${styles.td} ${styles.numeric}`}>
        {item.categoryConfidence === null
          ? '—'
          : Number(item.categoryConfidence).toFixed(2)}
      </td>
      <td className={`${styles.td} ${styles.numeric} ${styles.waiting}`}>
        {hours === null ? (
          <>
            <span aria-hidden="true">—</span>
            <span className={styles.srOnly}>대기 시간 없음</span>
          </>
        ) : (
          formatWaitingTime(hours)
        )}
        {overdue ? (
          <>
            {/* 앞의 공백으로 시간 표기와 붙어서 읽히지 않게 한다. */}
            <span className={styles.srOnly}>{' (24시간 초과)'}</span>
            <span className={styles.overdueMark} aria-hidden="true">
              초과
            </span>
          </>
        ) : null}
      </td>
      <td className={styles.td} title={item.assigneeEmail ?? undefined}>
        {getAssigneeName(item.assigneeEmail)}
      </td>
    </tr>
  );
};
