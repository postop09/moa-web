'use client';

import { useState, type FormEvent } from 'react';

import type { ScheduleCategory } from '@/entities/scheduleCategory';
import { useCreateSchedule, useUpdateSchedule } from '@/features/schedule';
import { Modal } from '@/shared/ui';

import type { ScheduleFormMode } from '../model/useCalendarPage';
import { toDayKey } from '../model/visibleRange';
import { ScheduleCategoryForm } from './ScheduleCategoryForm';
import { ScheduleCategoryPopover } from './ScheduleCategoryPopover';
import styles from './calendar.module.css';

type Props = {
  householdId: string;
  categories: ScheduleCategory[];
  mode: ScheduleFormMode;
  onCancel: () => void;
  onSuccess: () => void;
  onDelete?: () => void;
};

const padTime = (value: number) => String(value).padStart(2, '0');

const toTimeInputValue = (iso: string) => {
  const date = new Date(iso);
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
};

const fromLocalDateTime = (date: string, time: string) => {
  return new Date(`${date}T${time}:00`).toISOString();
};

const addHours = (date: string, time: string, hours: number) => {
  const next = new Date(`${date}T${time}:00`);
  next.setHours(next.getHours() + hours);
  return {
    date: toDayKey(next),
    time: `${padTime(next.getHours())}:${padTime(next.getMinutes())}`,
  };
};

export const ScheduleForm = ({
  householdId,
  categories,
  mode,
  onCancel,
  onSuccess,
  onDelete,
}: Props) => {
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule(householdId);

  const [title, setTitle] = useState(
    mode.type === 'edit' ? mode.schedule.title : '',
  );
  const [startDate, setStartDate] = useState(
    mode.type === 'edit'
      ? toDayKey(new Date(mode.schedule.startAt))
      : toDayKey(mode.date),
  );
  const [startTime, setStartTime] = useState(
    mode.type === 'edit' ? toTimeInputValue(mode.schedule.startAt) : '09:00',
  );
  const [endDate, setEndDate] = useState(
    mode.type === 'edit'
      ? toDayKey(new Date(mode.schedule.endAt))
      : toDayKey(mode.date),
  );
  const [endTime, setEndTime] = useState(
    mode.type === 'edit' ? toTimeInputValue(mode.schedule.endAt) : '10:00',
  );
  const [memo, setMemo] = useState(
    mode.type === 'edit' ? (mode.schedule.memo ?? '') : '',
  );
  const [categoryId, setCategoryId] = useState(
    mode.type === 'edit' && mode.schedule.categoryId !== null
      ? String(mode.schedule.categoryId)
      : '',
  );
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isPending = createSchedule.isPending || updateSchedule.isPending;
  const error = createSchedule.error ?? updateSchedule.error;

  const ensureEndAfter = (nextStartDate: string, nextStartTime: string) => {
    const startAt = fromLocalDateTime(nextStartDate, nextStartTime);
    const currentEnd = fromLocalDateTime(endDate, endTime);
    if (currentEnd > startAt) {
      return;
    }

    const next = addHours(nextStartDate, nextStartTime, 1);
    setEndDate(next.date);
    setEndTime(next.time);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    ensureEndAfter(value, startTime);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    ensureEndAfter(startDate, value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('제목을 입력해 주세요.');
      return;
    }

    const startAt = fromLocalDateTime(startDate, startTime);
    const endAt = fromLocalDateTime(endDate, endTime);

    if (endAt <= startAt) {
      setValidationError('종료 일시는 시작 일시보다 이후여야 합니다.');
      return;
    }

    try {
      if (mode.type === 'create') {
        await createSchedule.mutateAsync({
          householdId,
          title: trimmedTitle,
          startAt,
          endAt,
          memo: memo.trim() || null,
          categoryId: categoryId === '' ? null : Number(categoryId),
        });
      } else {
        await updateSchedule.mutateAsync({
          id: mode.schedule.id,
          title: trimmedTitle,
          startAt,
          endAt,
          memo: memo.trim() || null,
          categoryId: categoryId === '' ? null : Number(categoryId),
        });
      }

      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <>
      <Modal
        title={mode.type === 'create' ? '일정 추가' : '일정 수정'}
        onClose={onCancel}
        closeDisabled={isPending || creatingCategory}
      >
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="scheduleTitle">
              제목
            </label>
            <input
              id="scheduleTitle"
              className={styles.input}
              type="text"
              maxLength={80}
              required
              autoFocus
              value={title}
              disabled={isPending}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className={styles.rangeGroup}>
            <span className={styles.label}>시작</span>
            <div className={styles.timeRow}>
              <input
                id="scheduleStartDate"
                className={styles.input}
                type="date"
                required
                aria-label="시작 날짜"
                value={startDate}
                disabled={isPending}
                onChange={(event) => handleStartDateChange(event.target.value)}
              />
              <input
                id="scheduleStartTime"
                className={styles.input}
                type="time"
                required
                aria-label="시작 시간"
                value={startTime}
                disabled={isPending}
                onChange={(event) => handleStartTimeChange(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.rangeGroup}>
            <span className={styles.label}>종료</span>
            <div className={styles.timeRow}>
              <input
                id="scheduleEndDate"
                className={styles.input}
                type="date"
                required
                aria-label="종료 날짜"
                value={endDate}
                disabled={isPending}
                onChange={(event) => setEndDate(event.target.value)}
              />
              <input
                id="scheduleEndTime"
                className={styles.input}
                type="time"
                required
                aria-label="종료 시간"
                value={endTime}
                disabled={isPending}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label} id="scheduleCategoryLabel">
              카테고리 (선택)
            </span>
            <ScheduleCategoryPopover
              categories={categories}
              value={categoryId}
              disabled={isPending}
              onChange={setCategoryId}
              onCreate={() => setCreatingCategory(true)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="scheduleMemo">
              메모 (선택)
            </label>
            <input
              id="scheduleMemo"
              className={styles.input}
              type="text"
              maxLength={200}
              value={memo}
              disabled={isPending}
              onChange={(event) => setMemo(event.target.value)}
            />
          </div>

          {validationError ? (
            <p className={styles.error}>{validationError}</p>
          ) : null}

          {error ? (
            <p className={styles.error}>
              {error instanceof Error
                ? error.message
                : '일정 저장에 실패했습니다.'}
            </p>
          ) : null}

          <div className={styles.modalActions}>
            {onDelete ? (
              <button
                type="button"
                className={styles.dangerButton}
                onClick={onDelete}
                disabled={isPending}
              >
                삭제
              </button>
            ) : null}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onCancel}
              disabled={isPending}
            >
              취소
            </button>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? '저장 중…'
                : mode.type === 'create'
                  ? '추가'
                  : '저장'}
            </button>
          </div>
        </form>
      </Modal>
      {creatingCategory ? (
        <ScheduleCategoryForm
          householdId={householdId}
          mode={{ type: 'create' }}
          onCancel={() => setCreatingCategory(false)}
          onSuccess={(category) => {
            setCategoryId(String(category.id));
            setCreatingCategory(false);
          }}
        />
      ) : null}
    </>
  );
};
