'use client';

import { useId } from 'react';

import type {
  AdminInquiry,
  AdminOperator,
  UpdateAdminInquiryMetaReq,
} from '@/entities/admin';
import { getAdminStatusLabel } from '@/entities/inquiry';
import type { InquiryStatus } from '@/entities/inquiry';
import { Button } from '@/shared/ui';

import {
  STATUS_ASSIGNEE_DIRTY_TEXT,
  STATUS_ASSIGNEE_RESET_TEXT,
  STATUS_ASSIGNEE_SAVED_TEXT,
} from '../config/texts';
import {
  UNASSIGNED,
  useStatusAssigneeDraft,
} from '../model/useStatusAssigneeDraft';

import styles from './sidePanel.module.css';

type ChangeableStatus = 'waiting' | 'in_progress';

export type StatusAssigneeChange = Pick<
  UpdateAdminInquiryMetaReq,
  'status' | 'assigneeId'
>;

type Props = {
  inquiry: AdminInquiry;
  /** 아직 못 받았거나 실패하면 undefined */
  operators: AdminOperator[] | undefined;
  isLocked: boolean;
  lockHintId: string;
  /** 요청을 보내는 중. 선택과 버튼을 잠근다. */
  isSaving: boolean;
  /** 저장에 성공하면 true */
  onSave: (change: StatusAssigneeChange) => Promise<boolean>;
  /** 초안을 버릴 때. 이전 실패 안내를 지우는 데 쓴다. */
  onCancel: () => void;
};

const CHANGEABLE: ChangeableStatus[] = ['waiting', 'in_progress'];

const isChangeable = (status: string): status is ChangeableStatus =>
  CHANGEABLE.includes(status as ChangeableStatus);

type Option = { value: string; label: string; disabled: boolean };

// 종결·답변 완료는 직접 고를 수 없다. 현재 값일 때만 비활성 옵션으로 보여 준다.
const getStatusOptions = (status: InquiryStatus): Option[] => {
  const current: Option = {
    value: status,
    label: getAdminStatusLabel(status),
    disabled: true,
  };

  if (status === 'closed') return [current];

  const options = CHANGEABLE.map((value) => ({
    value,
    label: getAdminStatusLabel(value),
    disabled: false,
  }));

  return isChangeable(status) ? options : [...options, current];
};

const getAssigneeOptions = (
  inquiry: AdminInquiry,
  operators: AdminOperator[] | undefined,
): Option[] => {
  const options = (operators ?? []).map(({ userId, email }) => ({
    value: userId,
    label: email,
    disabled: false,
  }));
  const { assigneeId, assigneeEmail } = inquiry;

  if (assigneeId === null) {
    return [{ value: UNASSIGNED, label: '미지정', disabled: true }, ...options];
  }

  // 목록이 아직 없거나 현재 담당자가 목록에 없어도 선택값이 비지 않게 한다.
  return options.some((option) => option.value === assigneeId)
    ? options
    : [
        {
          value: assigneeId,
          label: assigneeEmail ?? '알 수 없는 운영자',
          disabled: false,
        },
        ...options,
      ];
};

/**
 * 상태·담당자는 고르는 즉시 저장하지 않고 초안으로만 둔다.
 * "저장" 을 누르면 서버 값과 달라진 항목만 한 번에 보낸다.
 */
export const StatusAssigneeSection = ({
  inquiry,
  operators,
  isLocked,
  lockHintId,
  isSaving,
  onSave,
  onCancel,
}: Props) => {
  const id = useId();
  const dirtyHintId = `${id}-dirty`;
  const isReadOnly = isLocked || isSaving;
  const draft = useStatusAssigneeDraft({
    inquiry,
    isReadOnly,
    save: ({ status, assigneeId }) =>
      onSave({
        ...(status !== undefined && isChangeable(status) ? { status } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
      }),
    onCancel,
  });
  const canSave = !isReadOnly && draft.isDirty;
  const describedBy = isLocked ? lockHintId : undefined;

  return (
    <div className={styles.statusGroup} aria-busy={isSaving || undefined}>
      <div className={styles.pair}>
        <div className={styles.fieldGroup}>
          <label htmlFor={`${id}-status`} className={styles.fieldLabel}>
            상태
          </label>
          <select
            id={`${id}-status`}
            className={styles.select}
            value={draft.status}
            aria-disabled={isReadOnly}
            aria-describedby={describedBy}
            onChange={(event) => {
              if (isChangeable(event.target.value)) {
                draft.changeStatus(event.target.value);
              }
            }}
          >
            {getStatusOptions(draft.savedStatus as InquiryStatus).map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor={`${id}-assignee`} className={styles.fieldLabel}>
            담당자
          </label>
          <select
            id={`${id}-assignee`}
            className={styles.select}
            value={draft.assignee}
            aria-disabled={isReadOnly}
            aria-describedby={describedBy}
            onChange={(event) => draft.changeAssignee(event.target.value)}
          >
            {getAssigneeOptions(inquiry, operators).map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {draft.isDirty ? (
        <p id={dirtyHintId} className={styles.savedText}>
          {STATUS_ASSIGNEE_DIRTY_TEXT}
        </p>
      ) : null}
      {draft.isReset ? (
        <p className={styles.savedText}>{STATUS_ASSIGNEE_RESET_TEXT}</p>
      ) : null}
      <div className={styles.editorActions}>
        <Button
          size="sm"
          className={styles.smallButton}
          loading={isSaving}
          aria-disabled={!canSave}
          aria-describedby={draft.isDirty ? dirtyHintId : undefined}
          onClick={() => void draft.submit()}
        >
          저장
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={styles.smallButton}
          aria-disabled={isReadOnly}
          onClick={draft.cancel}
        >
          취소
        </Button>
        {draft.isSaved ? (
          <p className={styles.savedText}>{STATUS_ASSIGNEE_SAVED_TEXT}</p>
        ) : null}
      </div>
    </div>
  );
};
