'use client';

import { useRef, type KeyboardEvent } from 'react';

import styles from './composer.module.css';

export type ComposerTab = 'reply' | 'memo';

const TABS: { id: ComposerTab; label: string }[] = [
  { id: 'reply', label: '답변' },
  { id: 'memo', label: '내부 메모' },
];

type Props = {
  selected: ComposerTab;
  idPrefix: string;
  onSelect: (tab: ComposerTab) => void;
};

export const getTabId = (idPrefix: string, tab: ComposerTab) =>
  `${idPrefix}-tab-${tab}`;
export const getPanelId = (idPrefix: string) => `${idPrefix}-panel`;

export const ComposerTabs = ({ selected, idPrefix, onSelect }: Props) => {
  const tabRefs = useRef(new Map<ComposerTab, HTMLButtonElement>());

  // 방향키는 포커스를 옮기면서 바로 선택한다. 끝에서는 반대편으로 순환한다.
  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    const step =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;

    if (step === 0) return;

    event.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length].id;

    onSelect(next);
    tabRefs.current.get(next)?.focus();
  };

  return (
    <div role="tablist" aria-label="작성 종류" className={styles.tabs}>
      {TABS.map((tab, index) => {
        const isSelected = tab.id === selected;

        return (
          <button
            key={tab.id}
            ref={(element) => {
              if (element) tabRefs.current.set(tab.id, element);
              else tabRefs.current.delete(tab.id);
            }}
            id={getTabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={isSelected}
            aria-controls={isSelected ? getPanelId(idPrefix) : undefined}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
