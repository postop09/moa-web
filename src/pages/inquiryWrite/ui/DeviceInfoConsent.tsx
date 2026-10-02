'use client';

import { useId, useState } from 'react';

import { collectDeviceInfo } from '@/entities/inquiry';

import styles from './inquiryWrite.module.css';

type Props = {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
};

/** 열릴 때만 렌더되므로 navigator 접근은 클라이언트에서만 일어난다. */
const DeviceInfoList = ({ id }: { id: string }) => {
  const [info] = useState(collectDeviceInfo);

  return (
    <dl id={id} className={styles.deviceList}>
      <div>
        <dt>앱 버전</dt>
        <dd>{info.appVersion}</dd>
      </div>
      <div>
        <dt>OS</dt>
        <dd>{info.os}</dd>
      </div>
      <div>
        <dt>기기 모델</dt>
        <dd>{info.device}</dd>
      </div>
      <div>
        <dt>언어</dt>
        <dd>{info.language}</dd>
      </div>
    </dl>
  );
};

export const DeviceInfoConsent = ({ checked, disabled, onChange }: Props) => {
  const checkboxId = useId();
  const descId = useId();
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={styles.device}>
      <div className={styles.deviceRow}>
        <input
          id={checkboxId}
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          disabled={disabled}
          aria-describedby={descId}
          onChange={(event) => onChange(event.target.checked)}
        />
        <label htmlFor={checkboxId} className={styles.deviceLabel}>
          앱·기기 정보 함께 보내기
        </label>
      </div>
      <p id={descId} className={styles.hint}>
        앱 버전, OS, 기기 모델, 언어만 보내요. 가계부 내역·금액은 보내지 않아요.
        운영자만 볼 수 있어요.
      </p>
      <button
        type="button"
        className={styles.linkButton}
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? '항목 접기' : '항목 보기'}
      </button>
      {isOpen ? <DeviceInfoList id={listId} /> : null}
    </section>
  );
};
