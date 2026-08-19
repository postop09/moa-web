'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { useDismissable } from '@/shared/lib';

import { useCurrentHousehold } from '../model/useCurrentHousehold';
import { HouseholdCreateRow } from './HouseholdCreateRow';
import styles from './householdPageTitle.module.css';

type Props = {
  subtitle: string;
};

export const HouseholdPageTitle = ({ subtitle }: Props) => {
  const { households, household, householdId, setHouseholdId, isLoading } =
    useCurrentHousehold();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  useDismissable(open, () => setOpen(false), rootRef);

  const label = isLoading ? '가계부' : (household?.name ?? '가계부 없음');
  const canOpen = !isLoading && households.length > 0;

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={!canOpen}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.title} role="heading" aria-level={1}>
          {label}
        </span>
        {canOpen ? (
          <ChevronDown
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
            size={20}
            aria-hidden
          />
        ) : null}
      </button>
      <p className={styles.subtitle}>{subtitle}</p>

      {open ? (
        <div className={styles.popover}>
          {households.length === 0 ? (
            <p className={styles.empty}>참여 중인 가계부가 없습니다.</p>
          ) : (
            <ul className={styles.list} id={listId} role="listbox">
              {households.map((item) => {
                const isActive = item.id === householdId;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                      onClick={() => {
                        setHouseholdId(item.id);
                        setOpen(false);
                      }}
                    >
                      {item.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className={styles.createFooter}>
            <HouseholdCreateRow
              onCreated={(created) => {
                setHouseholdId(created.id);
                setOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
