'use client';

import { useState } from 'react';

import { FAQ_SEARCH_MIN_LENGTH } from '@/entities/faq';
import type { InquiryCategory } from '@/entities/inquiry';
import { useFaqs, useSearchFaqs } from '@/features/faq';
import { useUnreadReplyCount } from '@/features/inquiry';
import { PageHeader } from '@/shared/ui';

import { CategoryChips } from './ui/CategoryChips';
import { FaqEmpty } from './ui/FaqEmpty';
import { FaqError } from './ui/FaqError';
import { FaqList } from './ui/FaqList';
import { FaqSearchInput } from './ui/FaqSearchInput';
import { FaqSkeleton } from './ui/FaqSkeleton';
import { InquiryCta } from './ui/InquiryCta';
import { MyInquiriesLink } from './ui/MyInquiriesLink';
import { SearchEmpty } from './ui/SearchEmpty';
import { SupportNotice } from './ui/SupportNotice';
import styles from './ui/support.module.css';

export const SupportPage = () => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<InquiryCategory | null>(null);

  const isSearching = keyword.trim().length >= FAQ_SEARCH_MIN_LENGTH;
  const faqsQuery = useFaqs(category ?? undefined);
  const searchQuery = useSearchFaqs(keyword);
  const { data: unreadCount = 0 } = useUnreadReplyCount();

  // 검색 결과가 아직 없는 디바운스 대기 중에는 현재 목록을 그대로 보여준다.
  const isSearchView =
    isSearching &&
    (searchQuery.data !== undefined || !searchQuery.isDebouncing);
  const activeQuery = isSearchView ? searchQuery : faqsQuery;
  const faqs = activeQuery.data;

  const isSearchSettled =
    isSearchView &&
    !searchQuery.isError &&
    !searchQuery.isDebouncing &&
    !searchQuery.isPlaceholderData &&
    faqs !== undefined;
  const searchAnnouncement = isSearchSettled
    ? faqs.length === 0
      ? '검색 결과가 없어요'
      : `검색 결과 ${faqs.length}개`
    : '';

  const renderFaqs = () => {
    if (activeQuery.isError) {
      return <FaqError onRetry={() => activeQuery.refetch()} />;
    }
    // 이전 데이터가 있으면(placeholder 포함) 스켈레톤 없이 그대로 보여준다.
    if (faqs === undefined) return <FaqSkeleton />;
    if (faqs.length === 0) {
      return isSearchView ? (
        <SearchEmpty />
      ) : (
        <FaqEmpty
          showAllVisible={category !== null}
          onShowAll={() => setCategory(null)}
        />
      );
    }

    return (
      <section className={styles.faqSection} aria-labelledby="faq-title">
        <h2 id="faq-title" className={styles.faqTitle}>
          {isSearchView ? '검색 결과' : '자주 묻는 질문'}
        </h2>
        <FaqList
          // 카테고리·검색이 바뀌면 열림 상태를 초기화한다.
          key={isSearchView ? 'search' : (category ?? 'all')}
          faqs={faqs}
        />
      </section>
    );
  };

  return (
    <main className={styles.page}>
      <PageHeader title="고객센터" backHref="/settings" />

      <div className={styles.content}>
        <SupportNotice />
        <FaqSearchInput value={keyword} onChange={setKeyword} />
        <p className="srOnly" role="status">
          {searchAnnouncement || null}
        </p>
        <CategoryChips
          selected={category}
          disabled={isSearching}
          onSelect={setCategory}
        />
        {renderFaqs()}
        <MyInquiriesLink unreadCount={unreadCount} />
      </div>

      <InquiryCta />
    </main>
  );
};

export default SupportPage;
