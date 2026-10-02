import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';

import { ADMIN_INQUIRY_PAGE_SIZES } from '@/entities/admin';
import type { AdminInquiryPageSize } from '@/entities/admin';

import { getPageItems } from '../lib/getPageItems';
import styles from './adminInquiries.module.css';

type Props = {
  page: number;
  pageSize: AdminInquiryPageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: AdminInquiryPageSize) => void;
};

export const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  const sizeId = useId();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className={styles.footer}>
      <nav className={styles.pager} aria-label="페이지 이동">
        {/* aria-disabled 로 두어 눌러도 이동하지 않지만 포커스는 잃지 않는다. */}
        <button
          type="button"
          className={styles.pageButton}
          aria-label="이전 페이지"
          aria-disabled={isFirst}
          onClick={() => {
            if (!isFirst) onPageChange(page - 1);
          }}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        {getPageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              className={styles.pageButton}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ) : (
            <span key={item} className={styles.ellipsis} aria-hidden="true">
              …
            </span>
          ),
        )}
        <button
          type="button"
          className={styles.pageButton}
          aria-label="다음 페이지"
          aria-disabled={isLast}
          onClick={() => {
            if (!isLast) onPageChange(page + 1);
          }}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </nav>
      <div className={styles.sizeField}>
        <label className={styles.label} htmlFor={sizeId}>
          페이지당 개수
        </label>
        <select
          id={sizeId}
          className={styles.select}
          value={pageSize}
          onChange={(event) => {
            const next = ADMIN_INQUIRY_PAGE_SIZES.find(
              (size) => String(size) === event.target.value,
            );

            if (next) onPageSizeChange(next);
          }}
        >
          {ADMIN_INQUIRY_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {`${size}개`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
