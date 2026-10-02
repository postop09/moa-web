'use client';

import { useId, useRef, useState } from 'react';

import { Button, Modal } from '@/shared/ui';

import {
  CLOSE_REASONS,
  CLOSE_REASON_MAX,
  CLOSE_REASON_OTHER,
} from '../config/texts';
import { trimText } from '../lib/trimText';

import styles from './sidePanel.module.css';

type Props = {
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

const UNSELECTED = '';
const REASON_HINT = '종결 사유를 선택해주세요';
const CUSTOM_HINT = '직접 입력해주세요';

/** 직접 입력은 "기타" 일 때만 쓴다. 미리 정한 사유로 바꾸면 쓰던 글은 무시한다. */
const getReason = (selected: string, custom: string) =>
  selected === CLOSE_REASON_OTHER ? trimText(custom) : selected;

export const CloseInquiryDialog = ({
  isPending,
  error,
  onCancel,
  onConfirm,
}: Props) => {
  const id = useId();
  const descriptionId = `${id}-description`;
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const overId = `${id}-over`;
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<string>(UNSELECTED);
  const [custom, setCustom] = useState('');
  const isOther = selected === CLOSE_REASON_OTHER;
  const reason = getReason(selected, custom);
  const isCustomOver = isOther && custom.length > CLOSE_REASON_MAX;
  const canConfirm = selected !== UNSELECTED && reason !== '' && !isCustomOver;
  // 종결하기가 막힌 이유. 막히지 않았거나 500자 초과면 없다(초과는 입력창 쪽에서 알린다).
  const hint =
    selected === UNSELECTED
      ? REASON_HINT
      : isOther && reason === ''
        ? CUSTOM_HINT
        : null;
  const confirmDescription = hint ? hintId : isCustomOver ? overId : undefined;

  const handleConfirm = () => {
    if (canConfirm) onConfirm(reason);
  };

  return (
    <Modal
      title="문의를 종결할까요?"
      role="alertdialog"
      descriptionId={descriptionId}
      initialFocus={cancelRef}
      closeDisabled={isPending}
      onClose={onCancel}
    >
      <div className={styles.dialogBody}>
        <p id={descriptionId} className={styles.dialogText}>
          종결하면 사용자는 추가 문의를 이어갈 수 없어요.
        </p>
        <p className={styles.dialogText}>
          사용자에게는 종결된 문의로만 표시돼요. 사유는 운영자에게만 보여요.
        </p>
        <div className={styles.fieldGroup}>
          <label htmlFor={`${id}-reason`} className={styles.fieldLabel}>
            종결 사유 (필수)
          </label>
          <select
            id={`${id}-reason`}
            className={styles.select}
            value={selected}
            aria-required
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value={UNSELECTED} disabled>
              사유 선택
            </option>
            {CLOSE_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {isOther ? (
          <div className={styles.fieldGroup}>
            <label htmlFor={`${id}-custom`} className={styles.fieldLabel}>
              직접 입력 (필수)
            </label>
            <textarea
              id={`${id}-custom`}
              className={styles.textarea}
              rows={3}
              value={custom}
              aria-required
              aria-invalid={isCustomOver || undefined}
              aria-describedby={isCustomOver ? `${countId} ${overId}` : countId}
              onChange={(event) => setCustom(event.target.value)}
            />
            {isCustomOver ? (
              <p id={overId} className={styles.counterOver}>
                {`${CLOSE_REASON_MAX}자를 넘었어요`}
              </p>
            ) : null}
            <p id={countId} className={styles.counter} data-over={isCustomOver}>
              {`${custom.length} / ${CLOSE_REASON_MAX}`}
            </p>
          </div>
        ) : null}
        {error ? (
          <p className={styles.dialogError} role="alert">
            {error}
          </p>
        ) : null}
        {hint ? (
          <p id={hintId} className={styles.dialogHint}>
            {hint}
          </p>
        ) : null}
        <div className={styles.dialogActions}>
          <Button
            ref={cancelRef}
            variant="secondary"
            disabled={isPending}
            onClick={onCancel}
          >
            취소
          </Button>
          <Button
            loading={isPending}
            aria-disabled={!canConfirm}
            aria-describedby={confirmDescription}
            onClick={handleConfirm}
          >
            종결하기
          </Button>
        </div>
      </div>
    </Modal>
  );
};
