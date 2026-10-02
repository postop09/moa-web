'use client';

import { X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import type { AdminInquiryFilters } from '@/entities/admin';
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABELS,
} from '@/entities/inquiry';
import type { InquiryStatus } from '@/entities/inquiry';

import { PERIOD_OPTIONS, STATUS_OPTIONS } from '../config/filterOptions';
import { useKeywordInput } from '../model/useKeywordInput';
import type { FilterUpdater } from '../model/useFilterNavigation';
import styles from './adminInquiries.module.css';

type Props = {
  filters: AdminInquiryFilters;
  isDefault: boolean;
  onChange: (change: Partial<AdminInquiryFilters> | FilterUpdater) => void;
  onReset: () => void;
};

export const FilterBar = ({ filters, isDefault, onChange, onReset }: Props) => {
  const ids = useId();
  const keywordRef = useRef<HTMLInputElement>(null);
  const keyword = useKeywordInput(
    filters.keyword,
    (next) => onChange({ keyword: next }),
    keywordRef,
  );
  // 마지막 상태를 끄려 시도한 시점의 filters. 같은 filters 일 때만 안내를 드러낸다(필터가 바뀌면 자동으로 숨김).
  const [attemptedFilters, setAttemptedFilters] =
    useState<AdminInquiryFilters | null>(null);
  const hintRevealed = attemptedFilters === filters;
  const isLastStatus = filters.statuses.length === 1;
  const statusHintId = `${ids}-status-hint`;
  const categoryNoteId = `${ids}-category-note`;
  const keywordHintId = `${ids}-keyword-hint`;

  const toggleStatus = (status: InquiryStatus) => {
    if (isLastStatus && filters.statuses.includes(status)) {
      setAttemptedFilters(filters);
    }

    onChange((latest) => {
      const selected = new Set(latest.statuses);

      if (selected.has(status)) {
        // 상태를 모두 끄면 URL 에서 기본값으로 읽히므로 마지막 하나는 끌 수 없다.
        if (selected.size === 1) return null;
        selected.delete(status);
      } else {
        selected.add(status);
      }

      return {
        statuses: STATUS_OPTIONS.map((option) => option.value).filter((value) =>
          selected.has(value),
        ),
      };
    });
  };

  const selectCategory = (value: string) =>
    onChange((latest) => {
      // 미분류만 보는 중에는 카테고리를 고를 수 없다(서로 모순되는 조합 방지).
      if (latest.uncategorizedOnly) return null;

      return {
        category:
          INQUIRY_CATEGORIES.find((category) => category === value) ?? null,
      };
    });

  const toggleUncategorized = () =>
    onChange((latest) => {
      const next = !latest.uncategorizedOnly;

      return {
        uncategorizedOnly: next,
        category: next ? null : latest.category,
      };
    });

  const selectPeriod = (param: string) => {
    const option = PERIOD_OPTIONS.find(
      (candidate) => candidate.param === param,
    );

    if (option) onChange({ periodDays: option.value });
  };

  return (
    <form
      className={styles.filters}
      role="search"
      aria-label="문의 필터"
      onSubmit={(event) => event.preventDefault()}
    >
      <fieldset className={styles.field}>
        <legend className={styles.label}>상태</legend>
        <div className={styles.checks}>
          {STATUS_OPTIONS.map((option) => {
            const checked = filters.statuses.includes(option.value);
            const isLast = checked && isLastStatus;

            return (
              <label key={option.value} className={styles.check}>
                <input
                  type="checkbox"
                  checked={checked}
                  // disabled 는 포커스를 잃으므로 aria-disabled 로 두고 변경만 무시한다.
                  aria-disabled={isLast || undefined}
                  aria-describedby={isLast ? statusHintId : undefined}
                  onChange={() => toggleStatus(option.value)}
                />
                {option.label}
              </label>
            );
          })}
        </div>
        {isLastStatus ? (
          <p
            id={statusHintId}
            className={styles.statusHint}
            data-revealed={hintRevealed}
          >
            상태는 최소 1개 선택돼 있어야 해요
          </p>
        ) : null}
      </fieldset>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${ids}-category`}>
          카테고리
        </label>
        <select
          id={`${ids}-category`}
          className={styles.select}
          value={filters.category ?? ''}
          aria-disabled={filters.uncategorizedOnly || undefined}
          aria-describedby={
            filters.uncategorizedOnly ? categoryNoteId : undefined
          }
          onChange={(event) => selectCategory(event.target.value)}
        >
          <option value="">전체</option>
          {INQUIRY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {INQUIRY_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        {filters.uncategorizedOnly ? (
          <p id={categoryNoteId} className={styles.hint}>
            미분류만 보는 중이라 카테고리는 고를 수 없어요
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${ids}-period`}>
          기간
        </label>
        <select
          id={`${ids}-period`}
          className={styles.select}
          value={
            PERIOD_OPTIONS.find((option) => option.value === filters.periodDays)
              ?.param
          }
          onChange={(event) => selectPeriod(event.target.value)}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.param} value={option.param}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <span className={styles.label} aria-hidden="true">
          &nbsp;
        </span>
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={filters.uncategorizedOnly}
          onClick={toggleUncategorized}
        >
          미분류만
        </button>
      </div>

      <div className={`${styles.field} ${styles.fieldGrow}`}>
        <label className={styles.label} htmlFor={`${ids}-keyword`}>
          제목·내용 검색
        </label>
        <div className={styles.inputWrap}>
          <input
            id={`${ids}-keyword`}
            ref={keywordRef}
            type="search"
            className={styles.input}
            placeholder="제목·내용 검색"
            autoComplete="off"
            aria-describedby={keyword.showHint ? keywordHintId : undefined}
            value={keyword.value}
            onChange={keyword.onChange}
            onKeyDown={keyword.onKeyDown}
          />
          {keyword.showClear ? (
            <button
              type="button"
              className={styles.clearButton}
              aria-label="검색어 지우기"
              onClick={keyword.clear}
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {keyword.showHint ? (
          <p id={keywordHintId} className={styles.hint}>
            2자 이상 입력하면 검색해요
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <span className={styles.label} aria-hidden="true">
          &nbsp;
        </span>
        <button
          type="button"
          className={styles.toggle}
          aria-disabled={isDefault}
          onClick={() => {
            if (!isDefault) onReset();
          }}
        >
          초기화
        </button>
      </div>
    </form>
  );
};
