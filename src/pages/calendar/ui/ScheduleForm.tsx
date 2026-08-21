'use client';

import { useState, type FormEvent } from 'react';

import { useCreateSchedule, useUpdateSchedule } from '@/features/schedule';
import { Modal } from '@/shared/ui';

import type { ScheduleFormMode } from '../model/useCalendarPage';
import { toDayKey } from '../model/visibleRange';
import styles from './calendar.module.css';

type Props = {
  householdId: string;
  mode: ScheduleFormMode;
  onCancel: () => void;
  onSuccess: () => void;
  onDelete?: () => void;
};

const toTimeInputValue = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const fromLocalDateTime = (date: string, time: string) => {
  return new Date(`${date}T${time}:00`).toISOString();
};

const defaultEndTime = (startTime: string) => {
  const [hourText, minuteText] = startTime.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return '10:00';
  }

  const nextHour = hour + 1;
  if (nextHour >= 24) {
    return '23:59';
  }

  return `${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const ScheduleForm = ({
  householdId,
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
  const [eventDate, setEventDate] = useState(
    mode.type === 'edit'
      ? toDayKey(new Date(mode.schedule.startAt))
      : toDayKey(mode.date),
  );
  const [startTime, setStartTime] = useState(
    mode.type === 'edit' ? toTimeInputValue(mode.schedule.startAt) : '09:00',
  );
  const [endTime, setEndTime] = useState(
    mode.type === 'edit' ? toTimeInputValue(mode.schedule.endAt) : '10:00',
  );
  const [memo, setMemo] = useState(
    mode.type === 'edit' ? (mode.schedule.memo ?? '') : '',
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const isPending = createSchedule.isPending || updateSchedule.isPending;
  const error = createSchedule.error ?? updateSchedule.error;

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    setEndTime((current) => {
      const start = fromLocalDateTime(eventDate, value);
      const end = fromLocalDateTime(eventDate, current);
      if (end <= start) {
        return defaultEndTime(value);
      }
      return current;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('제목을 입력해 주세요.');
      return;
    }

    const startAt = fromLocalDateTime(eventDate, startTime);
    const endAt = fromLocalDateTime(eventDate, endTime);

    if (endAt <= startAt) {
      setValidationError('종료 시간은 시작 시간보다 이후여야 합니다.');
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
        });
      } else {
        await updateSchedule.mutateAsync({
          id: mode.schedule.id,
          title: trimmedTitle,
          startAt,
          endAt,
          memo: memo.trim() || null,
        });
      }

      onSuccess();
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <Modal
      title={mode.type === 'create' ? '일정 추가' : '일정 수정'}
      onClose={onCancel}
      closeDisabled={isPending}
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="scheduleDate">
            날짜
          </label>
          <input
            id="scheduleDate"
            className={styles.input}
            type="date"
            required
            value={eventDate}
            disabled={isPending}
            onChange={(event) => setEventDate(event.target.value)}
          />
        </div>

        <div className={styles.timeRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="scheduleStartTime">
              시작
            </label>
            <input
              id="scheduleStartTime"
              className={styles.input}
              type="time"
              required
              value={startTime}
              disabled={isPending}
              onChange={(event) => handleStartTimeChange(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="scheduleEndTime">
              종료
            </label>
            <input
              id="scheduleEndTime"
              className={styles.input}
              type="time"
              required
              value={endTime}
              disabled={isPending}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
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
            {isPending ? '저장 중…' : mode.type === 'create' ? '추가' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
