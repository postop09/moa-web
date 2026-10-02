'use client';

import { useEffect, useId, useRef, useState, type RefObject } from 'react';

import type { AdminInquiry } from '@/entities/admin';
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABELS,
} from '@/entities/inquiry';
import type { InquiryCategory } from '@/entities/inquiry';
import { Button } from '@/shared/ui';

import { useServerValue } from '../model/useServerValue';

import styles from './sidePanel.module.css';

type Props = {
  inquiry: AdminInquiry;
  isLocked: boolean;
  lockHintId: string;
  isSaving: boolean;
  selectRef: RefObject<HTMLSelectElement | null>;
  /** 변경에 성공하면 true */
  onSave: (category: InquiryCategory) => Promise<boolean>;
};

const UNSELECTED = '';

export const CategorySection = ({
  inquiry,
  isLocked,
  lockHintId,
  isSaving,
  selectRef,
  onSave,
}: Props) => {
  const selectId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<InquiryCategory | typeof UNSELECTED>(
    UNSELECTED,
  );
  const changeButtonRef = useRef<HTMLButtonElement>(null);
  const focusChangeRef = useRef(false);
  const focusSelectRef = useRef(false);
  const saved = useServerValue(inquiry.category, inquiry.updatedAt);
  const category = saved.value;
  // 미분류는 답변 전에 반드시 지정해야 하므로 선택을 처음부터 펼쳐 둔다.
  const isForced = category === null && !isLocked;
  const showEditor = isForced || isEditing;
  const canSave = draft !== UNSELECTED && draft !== category && !isLocked;

  // 선택이 접히면 사라진 버튼 대신 "변경" 으로, 펼쳐지면 사라진 "변경" 대신 선택으로 포커스를 옮긴다.
  useEffect(() => {
    if (!showEditor && focusChangeRef.current) {
      focusChangeRef.current = false;
      changeButtonRef.current?.focus();
    }

    if (showEditor && focusSelectRef.current) {
      focusSelectRef.current = false;
      selectRef.current?.focus();
    }
  });

  const handleStartEdit = () => {
    if (isLocked) return;

    focusSelectRef.current = true;
    setDraft(category ?? UNSELECTED);
    setIsEditing(true);
  };

  const handleCancel = () => {
    focusChangeRef.current = true;
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!canSave) return;

    const isSaved = await onSave(draft);

    if (!isSaved) return;

    saved.set(draft);
    focusChangeRef.current = true;
    setIsEditing(false);
  };

  return (
    <section className={styles.section} aria-labelledby={`${selectId}-title`}>
      <h2 id={`${selectId}-title`} className={styles.sectionLabel}>
        카테고리 · Jev 분류
      </h2>
      <div className={styles.categoryBox}>
        <div>
          <p className={styles.categoryName}>
            {category ? INQUIRY_CATEGORY_LABELS[category] : '미분류'}
          </p>
          {category && inquiry.categoryConfidence !== null ? (
            <p className={styles.categoryConfidence}>
              {`신뢰도 ${inquiry.categoryConfidence.toFixed(2)}`}
            </p>
          ) : null}
        </div>
        {!showEditor ? (
          <Button
            ref={changeButtonRef}
            variant="secondary"
            size="sm"
            className={styles.smallButton}
            aria-disabled={isLocked}
            aria-describedby={isLocked ? lockHintId : undefined}
            onClick={handleStartEdit}
          >
            변경
          </Button>
        ) : null}
      </div>
      {showEditor ? (
        <div className={styles.editor}>
          <label htmlFor={selectId} className={styles.fieldLabel}>
            카테고리 변경
          </label>
          <select
            id={selectId}
            ref={selectRef}
            className={styles.select}
            value={draft}
            onChange={(event) =>
              setDraft(event.target.value as InquiryCategory)
            }
          >
            <option value={UNSELECTED} disabled>
              카테고리 선택
            </option>
            {INQUIRY_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {INQUIRY_CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
          <div className={styles.editorActions}>
            <Button
              size="sm"
              className={styles.smallButton}
              loading={isSaving}
              aria-disabled={!canSave}
              onClick={handleSave}
            >
              저장
            </Button>
            {!isForced ? (
              <Button
                variant="secondary"
                size="sm"
                className={styles.smallButton}
                onClick={handleCancel}
              >
                취소
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
};
