import { useId } from 'react';

import type {
  AdminInquiryFilters,
  AdminInquiryListItem,
} from '@/entities/admin';

import { InquiryRow } from './InquiryRow';
import { SortHeader } from './SortHeader';
import styles from './adminInquiries.module.css';

const SKELETON_ROWS = 5;
const COLUMN_COUNT = 6;

type Props = {
  filters: AdminInquiryFilters;
  /** null 이면 데이터가 없어 뼈대 행을 보인다. */
  items: AdminInquiryListItem[] | null;
  busy: boolean;
  /** 이전 결과를 유지한 채 새 결과를 불러오는 중이다(흐리게 보인다). */
  stale: boolean;
  onSort: (sort: 'waiting' | 'confidence') => void;
};

const getDirection = (
  filters: AdminInquiryFilters,
  sort: 'waiting' | 'confidence',
) => {
  if (filters.sort !== sort) return null;

  // 대기 정렬의 화면 이름은 "답변 대기 먼저 · 오래 기다린 순/최근 대기 순"(SORT_LABELS)이며,
  // 대기는 "오래 기다린 순"이 sortDir asc 이므로 시간 값 기준 방향과 반대다.
  // 서버는 대기 정렬일 때 방향과 무관하게 상태 그룹(답변 대기 -> 처리 중 -> 그 외)을 먼저 묶고
  // 그 안에서 대기 시간을 정렬하므로, 이 aria-sort 는 각 그룹 안의 순서를 뜻한다.
  const ascendingValue =
    sort === 'waiting' ? filters.sortDir === 'desc' : filters.sortDir === 'asc';

  return ascendingValue ? 'ascending' : 'descending';
};

export const InquiryTable = ({
  filters,
  items,
  busy,
  stale,
  onSort,
}: Props) => {
  const waitingHintId = useId();

  return (
    <div
      className={styles.tableScroll}
      role="region"
      data-stale={stale || undefined}
      aria-label="문의 목록 표"
      tabIndex={0}
    >
      <span id={waitingHintId} className={styles.srOnly}>
        답변 대기 건이 먼저 표시돼요
      </span>
      <table className={styles.table} aria-busy={busy || undefined}>
        <caption className={styles.srOnly}>문의 목록</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.th}>
              상태
            </th>
            <th scope="col" className={styles.th}>
              카테고리 (Jev)
            </th>
            <th scope="col" className={styles.th}>
              제목
            </th>
            <SortHeader
              label="신뢰도"
              direction={getDirection(filters, 'confidence')}
              onSort={() => onSort('confidence')}
            />
            <SortHeader
              label="대기"
              direction={getDirection(filters, 'waiting')}
              descriptionId={waitingHintId}
              onSort={() => onSort('waiting')}
            />
            <th scope="col" className={styles.th}>
              담당자
            </th>
          </tr>
        </thead>
        <tbody>
          {items
            ? items.map((item) => <InquiryRow key={item.id} item={item} />)
            : Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <tr key={index}>
                  <td colSpan={COLUMN_COUNT} className={styles.td}>
                    <span className={styles.skeleton} aria-hidden="true" />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};
