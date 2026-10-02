'use client';

import { useEffect, useRef } from 'react';

import {
  parseAdminInquiryFilters,
  serializeAdminInquiryFilters,
} from '@/entities/admin';
import type { AdminInquiryFilters } from '@/entities/admin';
import { useAdminInquiries } from '@/features/adminInquiry';

import { SORT_LABELS } from '../config/filterOptions';
import { isAuthError } from '../lib/isAuthError';
import { useFilterNavigation } from '../model/useFilterNavigation';
import { useOutOfRangeRedirect } from '../model/useOutOfRangeRedirect';
import { FilterBar } from './FilterBar';
import { InquiryTable } from './InquiryTable';
import { Pagination } from './Pagination';
import { EmptyResult, ErrorResult } from './ResultState';
import styles from './adminInquiries.module.css';

type Props = {
  filters: AdminInquiryFilters;
};

type View = 'loading' | 'rows' | 'empty' | 'error';

export const AdminInquiriesContent = ({ filters }: Props) => {
  const query = useAdminInquiries(filters);
  const { apply, reset, replaceWith } = useFilterNavigation(filters);
  const results = useRef<HTMLElement>(null);
  const pagerFocus = useRef(false);

  const items = query.data?.items;
  const total = query.data?.total ?? 0;
  // 필터를 바꿔 새로 불러오는 동안은 이전 결과(placeholder)를 보여준다.
  const isSettled = query.isSuccess && !query.isPlaceholderData;
  const isOutOfRange = isSettled && items?.length === 0 && filters.page > 1;

  useOutOfRangeRedirect(isOutOfRange, filters, replaceWith);

  let view: View;

  if (query.isError) {
    view = 'error';
  } else if (
    !items ||
    isOutOfRange ||
    (query.isPlaceholderData && items.length === 0)
  ) {
    view = 'loading';
  } else {
    view = items.length === 0 ? 'empty' : 'rows';
  }

  // 결과 영역의 조작 요소(정렬·쪽 번호·다시 시도·초기화)가 사라져도 포커스가 body 로 떨어지지 않게 한다.
  const previousView = useRef<View>(view);

  useEffect(() => {
    const wasRows = previousView.current === 'rows';

    previousView.current = view;

    if (wasRows && view !== 'rows' && view !== 'loading') {
      if (!document.activeElement || document.activeElement === document.body) {
        results.current?.focus();
      }
    }
  }, [view]);

  // 쪽 번호 창이 이동하면 누른 번호 버튼이 사라질 수 있어 현재 쪽 버튼으로 포커스를 옮긴다.
  useEffect(() => {
    if (!pagerFocus.current) return;

    pagerFocus.current = false;

    if (!results.current?.contains(document.activeElement)) {
      results.current
        ?.querySelector<HTMLElement>('[aria-current="page"]')
        ?.focus();
    }
  }, [filters.page]);

  const focusResults = () => results.current?.focus();
  const isDefault = serializeAdminInquiryFilters(filters) === '';

  const handleSort = (sort: 'waiting' | 'confidence') =>
    apply((latest) =>
      latest.sort === sort
        ? { sortDir: latest.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sort, sortDir: 'asc' },
    );

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const showTotal = isSettled && !isOutOfRange && query.data !== undefined;
  let announcement = '';

  if (query.isError || isOutOfRange) {
    // 오류 안내는 alert 한 곳에서만, 쪽 이동 중에는 알리지 않는다.
    announcement = '';
  } else if (showTotal && !query.isFetching) {
    announcement = `문의 ${total}건 · ${filters.page}/${totalPages}쪽 · ${SORT_LABELS[filters.sort][filters.sortDir]}`;
  } else {
    announcement = '불러오는 중';
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>문의 관리</h1>
        {showTotal ? (
          <p className={styles.headingTotal}>{`총 ${total}건`}</p>
        ) : null}
      </div>
      <p role="status" className={styles.srOnly}>
        {announcement}
      </p>
      <FilterBar
        filters={filters}
        isDefault={isDefault}
        onChange={apply}
        onReset={reset}
      />
      <section
        ref={results}
        className={styles.results}
        aria-label="문의 목록 결과"
        tabIndex={-1}
      >
        {view === 'error' ? (
          <ErrorResult
            isAuthError={isAuthError(query.error)}
            onRetry={() => {
              // 다시 시도하면 이 버튼이 사라지므로 먼저 포커스를 옮겨 둔다.
              focusResults();
              void query.refetch();
            }}
          />
        ) : null}
        {view === 'empty' ? (
          <EmptyResult
            isDefault={isDefault}
            onReset={() => {
              focusResults();
              reset();
            }}
            onShowAnswered={() => {
              focusResults();
              replaceWith(parseAdminInquiryFilters({ status: 'answered' }));
            }}
          />
        ) : null}
        {view === 'loading' || view === 'rows' ? (
          <>
            <InquiryTable
              filters={filters}
              items={view === 'rows' ? (items ?? null) : null}
              busy={view === 'loading' || query.isFetching}
              stale={view === 'rows' && query.isPlaceholderData}
              onSort={handleSort}
            />
            {view === 'rows' ? (
              <Pagination
                page={filters.page}
                pageSize={filters.pageSize}
                total={total}
                onPageChange={(page) => {
                  pagerFocus.current = true;
                  apply({ page });
                }}
                onPageSizeChange={(pageSize) => apply({ pageSize })}
              />
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
};
