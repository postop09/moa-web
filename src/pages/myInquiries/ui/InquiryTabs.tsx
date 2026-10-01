'use client';

import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

import type { InquiryStatusFilter } from '@/entities/inquiry';

import { STATUS_TABS } from '../config/statusTabs';

import styles from './myInquiries.module.css';

type Props = {
  selected: InquiryStatusFilter;
  baseId: string;
  onSelect: (status: InquiryStatusFilter) => void;
};

export const getTabId = (baseId: string, status: InquiryStatusFilter) =>
  `${baseId}-tab-${status}`;

export const getPanelId = (baseId: string) => `${baseId}-panel`;

export const InquiryTabs = ({ selected, baseId, onSelect }: Props) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 화살표 키는 포커스만 옮긴다. 탭을 바꾸면 목록을 다시 불러오므로 Enter/Space 로 확정한다.
  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    const last = STATUS_TABS.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % STATUS_TABS.length
        : event.key === 'ArrowLeft'
          ? (index + last) % STATUS_TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;

    if (next === null) return;

    event.preventDefault();
    tabRefs.current[next]?.focus();
  };

  return (
    <div className={styles.tabs} role="tablist" aria-label="문의 상태">
      {STATUS_TABS.map(({ status, label }, index) => {
        const isSelected = status === selected;

        return (
          <button
            key={status}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={getTabId(baseId, status)}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={isSelected}
            aria-controls={getPanelId(baseId)}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(status)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
