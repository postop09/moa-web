'use client';

import { useEffect, useRef, useState } from 'react';

import type { AdminInquiry } from '@/entities/admin';
import { useBeforeUnloadGuard } from '@/shared/lib';

import { SAVED_FEEDBACK_MS } from '../config/texts';

import { useServerValue } from './useServerValue';

export const UNASSIGNED = '';

type Props = {
  inquiry: AdminInquiry;
  /** 잠겼거나 저장 중이면 편집·저장을 받지 않는다. */
  isReadOnly: boolean;
  /** 서버 값과 달라진 항목만 넘긴다. 저장에 성공하면 true. */
  save: (changed: { status?: string; assigneeId?: string }) => Promise<boolean>;
  /** 초안을 버릴 때. 이전 실패 안내를 지우는 데 쓴다. */
  onCancel: () => void;
};

/**
 * 상태·담당자 초안. 고르는 즉시 저장하지 않고, 서버 값과 달라진 항목만 "저장" 으로 보낸다.
 * 초안이 있는 동안 서버의 updatedAt 이 바뀌면(다른 곳에서 변경) 초안을 버리고 한 번 알린다.
 * 서버에는 expected-updatedAt 검사가 없으므로 낡은 초안을 보내지 않게 하는 것은 클라이언트의 몫이다.
 */
export const useStatusAssigneeDraft = ({
  inquiry,
  isReadOnly,
  save,
  onCancel,
}: Props) => {
  const savedStatus = useServerValue<string>(inquiry.status, inquiry.updatedAt);
  const savedAssignee = useServerValue<string>(
    inquiry.assigneeId ?? UNASSIGNED,
    inquiry.updatedAt,
  );
  // null 이면 초안 없이 서버 값을 따른다.
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [draftAssignee, setDraftAssignee] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const previousUpdatedAtRef = useRef(inquiry.updatedAt);
  const wasDirtyRef = useRef(false);
  // 내 저장이 서버를 바꾼 것은 "다른 곳에서 변경" 이 아니다. 다음 편집 전까지 한 번만 건너뛴다.
  const ownSaveRef = useRef(false);

  const status = draftStatus ?? savedStatus.value;
  const assignee = draftAssignee ?? savedAssignee.value;
  const isStatusChanged = status !== savedStatus.value;
  const isAssigneeChanged = assignee !== savedAssignee.value;
  const isDirty = isStatusChanged || isAssigneeChanged;

  useBeforeUnloadGuard(isDirty);

  useEffect(() => {
    if (previousUpdatedAtRef.current !== inquiry.updatedAt) {
      previousUpdatedAtRef.current = inquiry.updatedAt;

      if (ownSaveRef.current) {
        ownSaveRef.current = false;
      } else if (wasDirtyRef.current) {
        setDraftStatus(null);
        setDraftAssignee(null);
        setIsSaved(false);
        setIsReset(true);
      }
    }

    wasDirtyRef.current = isDirty;
  }, [inquiry.updatedAt, isDirty]);

  useEffect(() => {
    if (!isSaved) return;

    const timer = setTimeout(() => setIsSaved(false), SAVED_FEEDBACK_MS);

    return () => clearTimeout(timer);
  }, [isSaved]);

  const startEdit = () => {
    ownSaveRef.current = false;
    setIsSaved(false);
    setIsReset(false);
  };

  const changeStatus = (value: string) => {
    if (isReadOnly) return;

    startEdit();
    setDraftStatus(value);
  };

  const changeAssignee = (value: string) => {
    if (isReadOnly || value === UNASSIGNED) return;

    startEdit();
    setDraftAssignee(value);
  };

  const submit = async () => {
    if (isReadOnly || !isDirty) return;

    setIsSaved(false);
    setIsReset(false);
    ownSaveRef.current = true;

    const isSuccess = await save({
      ...(isStatusChanged ? { status } : {}),
      ...(isAssigneeChanged ? { assigneeId: assignee } : {}),
    });

    if (!isSuccess) {
      ownSaveRef.current = false;

      return;
    }

    // 서버가 다시 조회되어 updatedAt 이 바뀔 때까지는 저장한 값을 기준으로 보여 준다.
    savedStatus.set(status);
    savedAssignee.set(assignee);
    setDraftStatus(null);
    setDraftAssignee(null);
    setIsSaved(true);
  };

  const cancel = () => {
    if (isReadOnly) return;

    setDraftStatus(null);
    setDraftAssignee(null);
    setIsSaved(false);
    setIsReset(false);
    onCancel();
  };

  return {
    status,
    assignee,
    savedStatus: savedStatus.value,
    isDirty,
    isSaved,
    isReset,
    changeStatus,
    changeAssignee,
    submit,
    cancel,
  };
};
