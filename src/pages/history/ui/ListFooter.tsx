'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import styles from './history.module.css';

type Props = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  loadedCount: number;
  onLoadMore: () => void;
};

export const ListFooter = ({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  loadedCount,
  onLoadMore,
}: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevLoadedCountRef = useRef(loadedCount);
  const prevFetchingRef = useRef(isFetchingNextPage);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!hasNextPage || isFetchNextPageError) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchNextPageError, onLoadMore]);

  useEffect(() => {
    if (
      prevFetchingRef.current &&
      !isFetchingNextPage &&
      !isFetchNextPageError
    ) {
      const diff = loadedCount - prevLoadedCountRef.current;
      if (diff > 0) {
        setAnnouncement(`${diff}건을 더 불러왔습니다. 현재 ${loadedCount}건.`);
      }
    }
    prevFetchingRef.current = isFetchingNextPage;
    prevLoadedCountRef.current = loadedCount;
  }, [isFetchingNextPage, isFetchNextPageError, loadedCount]);

  return (
    <div className={styles.listFooter}>
      <div
        ref={sentinelRef}
        aria-hidden
        className={styles.listFooterSentinel}
      />

      {isFetchNextPageError ? (
        <div className={styles.listFooterError}>
          <p className={styles.listFooterErrorText}>
            내역을 더 불러오지 못했습니다.
          </p>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={onLoadMore}
          >
            다시 시도
          </button>
        </div>
      ) : hasNextPage ? (
        <button
          type="button"
          className={styles.loadMoreButton}
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
          aria-busy={isFetchingNextPage}
        >
          {isFetchingNextPage ? (
            <>
              <Loader2 size={14} className={styles.spinnerIcon} aria-hidden />
              불러오는 중…
            </>
          ) : (
            '더 보기'
          )}
        </button>
      ) : (
        <p className={styles.listFooterEnd}>모든 내역을 불러왔습니다</p>
      )}

      <p role="status" aria-live="polite" className="srOnly">
        {announcement}
      </p>
    </div>
  );
};
