import Link from 'next/link';
import { useId } from 'react';

import type { AdminRecentInquiry } from '@/entities/admin';
import {
  formatInquiryListDate,
  getAdminStatusLabel,
  getInquiryCategoryLabel,
} from '@/entities/inquiry';

import styles from './sidePanel.module.css';

const MAX_ITEMS = 5;

type Props = {
  items: AdminRecentInquiry[] | undefined;
  isError: boolean;
};

export const RecentInquiriesSection = ({ items, isError }: Props) => {
  const titleId = useId();

  return (
    <section
      className={styles.section}
      aria-labelledby={titleId}
      aria-busy={(items === undefined && !isError) || undefined}
    >
      <h2 id={titleId} className={styles.sectionLabel}>
        이전 문의
      </h2>
      {isError ? (
        <p className={styles.muted}>이전 문의를 불러오지 못했어요</p>
      ) : items === undefined ? (
        <p className={styles.muted}>불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>이전 문의가 없어요</p>
      ) : (
        <ul className={styles.recentList}>
          {items.slice(0, MAX_ITEMS).map((item) => (
            <li key={item.id}>
              <Link
                // 미리보기로 열어 이전 문의를 훑어볼 때 담당자가 자동 지정되지 않게 한다.
                href={`/admin/inquiries/${item.id}?peek=1`}
                className={styles.recentLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.recentTitle}>{item.title}</span>
                <span className={styles.recentMeta}>
                  {`${getInquiryCategoryLabel(item.category)} · ${getAdminStatusLabel(item.status)} · ${formatInquiryListDate(item.createdAt)}`}
                </span>
                <span className="srOnly">(새 탭에서 열림)</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
