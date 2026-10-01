'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type {
  GetMyInquiriesRes,
  InquiryStatusFilter,
} from '@/entities/inquiry';
import { useMyInquiries } from '@/features/inquiry';
import { useSafeBack } from '@/shared/lib';
import { PageHeader } from '@/shared/ui';

import { getStatusPath, STATUS_TABS } from '../config/statusTabs';
import { useInfiniteSentinel } from '../model/useInfiniteSentinel';

import { InquiryCard } from './InquiryCard';
import { getPanelId, getTabId, InquiryTabs } from './InquiryTabs';
import { ListSkeleton } from './ListSkeleton';
import { ListEmpty, ListError } from './ListState';
import { MoreRow } from './MoreRow';
import styles from './myInquiries.module.css';

const flattenPages = (pages: GetMyInquiriesRes[] | undefined) => [
  ...new Map(
    (pages?.flatMap((page) => page.items) ?? []).map(
      (inquiry) => [inquiry.id, inquiry] as const,
    ),
  ).values(),
];

type Props = {
  status: InquiryStatusFilter;
};

export const MyInquiriesContent = ({ status }: Props) => {
  const router = useRouter();
  const goBack = useSafeBack('/support');
  const baseId = useId();

  // 탭은 눌렀을 때 바로 바뀌어야 해서 URL(prop) 반영을 기다리지 않고 로컬로 먼저 바꾼다.
  const [selected, setSelected] = useState(status);
  const [syncedStatus, setSyncedStatus] = useState(status);
  if (syncedStatus !== status) {
    setSyncedStatus(status);
    setSelected(status);
  }

  const query = useMyInquiries(selected);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  // 페이지 사이에 새 문의가 끼면 같은 문의가 두 페이지에 걸칠 수 있어 id 로 거른다.
  const items = flattenPages(query.data?.pages);
  const selectedLabel =
    STATUS_TABS.find((tab) => tab.status === selected)?.label ?? '';

  const listRef = useRef<HTMLUListElement>(null);
  // 탭을 불러오면 '{탭} 문의 N건' 을 한 번 알린다. 재조회로는 다시 알리지 않는다.
  const [announced, setAnnounced] = useState<{
    status: string;
    text: string;
  } | null>(null);

  const loadingMoreRef = useRef(false);
  // 버튼으로 불러온 뒤에는 버튼이 사라지므로 새로 붙은 첫 카드로 포커스를 옮긴다.
  const focusIndexRef = useRef<number | null>(null);
  // 실패 뒤 다시 시도하는 동안에도 오류 행(과 그 안의 버튼)을 유지해 포커스를 잃지 않게 한다.
  const [isRetryingError, setIsRetryingError] = useState(false);

  const hasData = query.data !== undefined;
  if (hasData && announced?.status !== selected) {
    setAnnounced({
      status: selected,
      text: `${selectedLabel} 문의 ${items.length}건`,
    });
  } else if (!hasData && announced) {
    setAnnounced(null);
  }
  // 이미 받은 목록의 백그라운드 재조회 실패와 구분해 다음 페이지 실패만 재시도 행으로 보인다.
  const isNextPageError = query.isFetchNextPageError;

  const loadMore = (options?: { moveFocus?: boolean }) => {
    if (loadingMoreRef.current || !hasNextPage) return;

    loadingMoreRef.current = true;
    if (options?.moveFocus) focusIndexRef.current = items.length;
    if (isNextPageError) setIsRetryingError(true);
    const previousCount = items.length;
    void fetchNextPage()
      .then((result) => {
        const total = flattenPages(result.data?.pages).length;
        const added = total - previousCount;

        // 다음 페이지를 붙인 결과만 한 번 알린다(전체 수를 다시 읽지 않는다).
        if (!result.isError && added > 0) {
          setAnnounced({
            status: selected,
            text: `문의 ${added}건 더 불러왔어요 (총 ${total}건)`,
          });
        }
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setIsRetryingError(false);
      });
  };

  const canAutoLoad = hasNextPage && !isNextPageError && !isFetchingNextPage;
  const { sentinelRef, isSupported } = useInfiniteSentinel(
    () => loadMore(),
    canAutoLoad,
  );

  useEffect(() => {
    const index = focusIndexRef.current;
    if (index === null || items.length <= index) return;

    focusIndexRef.current = null;
    listRef.current?.querySelectorAll('a')[index]?.focus();
  }, [items.length]);

  const handleSelect = (next: InquiryStatusFilter) => {
    if (next === selected) return;

    setSelected(next);
    router.replace(getStatusPath(next), { scroll: false });
  };

  const renderList = () => {
    if (query.isError && !hasData) {
      return <ListError onRetry={() => void query.refetch()} />;
    }
    if (!hasData) return <ListSkeleton />;
    if (items.length === 0) {
      return (
        <ListEmpty
          filterLabel={selected === 'all' ? null : selectedLabel}
          onShowAll={() => handleSelect('all')}
        />
      );
    }

    return (
      <>
        <ul ref={listRef} className={styles.list}>
          {items.map((inquiry) => (
            <li key={inquiry.id}>
              <InquiryCard inquiry={inquiry} />
            </li>
          ))}
        </ul>
        {hasNextPage ? <div ref={sentinelRef} aria-hidden /> : null}
        <MoreRow
          isError={isNextPageError || isRetryingError}
          isLoading={isFetchingNextPage}
          showLoadMore={
            Boolean(hasNextPage) && !isSupported && !isNextPageError
          }
          onLoadMore={() => loadMore({ moveFocus: true })}
        />
      </>
    );
  };

  return (
    <main className={styles.page}>
      <PageHeader title="내 문의" onBack={goBack} />
      <InquiryTabs
        selected={selected}
        baseId={baseId}
        onSelect={handleSelect}
      />
      <p className="srOnly" role="status">
        {announced?.text ?? null}
      </p>
      <div
        className={styles.panel}
        role="tabpanel"
        id={getPanelId(baseId)}
        aria-labelledby={getTabId(baseId, selected)}
      >
        {renderList()}
      </div>
    </main>
  );
};
