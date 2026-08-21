'use client';

import { useState, type CSSProperties } from 'react';

import type { ScheduleCategory } from '@/entities/scheduleCategory';

import type { AuthorFilter, AuthorOption } from '../model/useCalendarPage';
import { ScheduleCategoryDeleteConfirm } from './ScheduleCategoryDeleteConfirm';
import { ScheduleCategoryForm } from './ScheduleCategoryForm';
import styles from './calendar.module.css';

type CategoryPanel =
  | { type: 'idle' }
  | { type: 'create' }
  | { type: 'edit'; category: ScheduleCategory }
  | { type: 'delete'; category: ScheduleCategory };

type Props = {
  householdId: string;
  open: boolean;
  showExpenses: boolean;
  authorFilter: AuthorFilter;
  authorOptions: AuthorOption[];
  categories: ScheduleCategory[];
  onToggleExpenses: (value: boolean) => void;
  onAuthorFilterChange: (value: AuthorFilter) => void;
  onClose: () => void;
};

export const CalendarSidebar = ({
  householdId,
  open,
  showExpenses,
  authorFilter,
  authorOptions,
  categories,
  onToggleExpenses,
  onAuthorFilterChange,
  onClose,
}: Props) => {
  const [panel, setPanel] = useState<CategoryPanel>({ type: 'idle' });

  return (
    <>
      <button
        type="button"
        className={`${styles.sidebarBackdrop} ${open ? styles.sidebarBackdropOpen : ''}`}
        aria-label="필터 닫기"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        id="calendar-sidebar"
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
        aria-label="달력 필터"
      >
        <section className={styles.sidebarSection}>
          <label className={styles.toggleRow}>
            <span className={styles.toggleLabel}>지출 표시</span>
            <input
              className={styles.visuallyHidden}
              type="checkbox"
              role="switch"
              checked={showExpenses}
              aria-checked={showExpenses}
              onChange={(event) => onToggleExpenses(event.target.checked)}
            />
            <span className={styles.switchTrack} aria-hidden>
              <span className={styles.switchThumb} />
            </span>
          </label>
        </section>

        <section className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>작성자</h3>
          <div
            className={styles.authorGroup}
            role="group"
            aria-label="작성자 필터"
          >
            <button
              type="button"
              className={`${styles.authorChip} ${authorFilter === 'all' ? styles.authorChipActive : ''}`}
              onClick={() => onAuthorFilterChange('all')}
            >
              전체
            </button>
            {authorOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.authorChip} ${authorFilter === option.id ? styles.authorChipActive : ''}`}
                style={{ '--author-color': option.color } as CSSProperties}
                onClick={() => onAuthorFilterChange(option.id)}
              >
                <span
                  className={styles.authorDot}
                  style={{ background: option.color }}
                  aria-hidden
                />
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>카테고리</h3>
          {categories.length === 0 ? (
            <p className={styles.empty}>등록된 카테고리가 없습니다.</p>
          ) : (
            <ul className={styles.categoryManageList}>
              {categories.map((category) => (
                <li key={category.id} className={styles.categoryManageRow}>
                  <span
                    className={styles.authorDot}
                    style={{ background: category.color }}
                    aria-hidden
                  />
                  <span className={styles.categoryManageName}>
                    {category.name}
                  </span>
                  <div className={styles.categoryManageActions}>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => setPanel({ type: 'edit', category })}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={styles.textDangerButton}
                      onClick={() => setPanel({ type: 'delete', category })}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={styles.sidebarAddButton}
            onClick={() => setPanel({ type: 'create' })}
          >
            추가
          </button>
        </section>
      </aside>

      {panel.type === 'create' ? (
        <ScheduleCategoryForm
          householdId={householdId}
          mode={{ type: 'create' }}
          onCancel={() => setPanel({ type: 'idle' })}
          onSuccess={() => setPanel({ type: 'idle' })}
        />
      ) : null}

      {panel.type === 'edit' ? (
        <ScheduleCategoryForm
          key={panel.category.id}
          householdId={householdId}
          mode={{ type: 'edit', category: panel.category }}
          onCancel={() => setPanel({ type: 'idle' })}
          onSuccess={() => setPanel({ type: 'idle' })}
        />
      ) : null}

      {panel.type === 'delete' ? (
        <ScheduleCategoryDeleteConfirm
          householdId={householdId}
          category={panel.category}
          onCancel={() => setPanel({ type: 'idle' })}
          onSuccess={() => setPanel({ type: 'idle' })}
        />
      ) : null}
    </>
  );
};
