import { useId, type ChangeEvent } from 'react';

import styles from './inquiryWrite.module.css';

type Props = {
  /** 폼에서 이름으로 찾아 포커스를 옮기는 데 쓴다. */
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  /** "{n} / {max}" 같은 글자 수 문구 */
  counter: string;
  isOverLimit?: boolean;
  error?: string;
  readOnly?: boolean;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  /** 필드 설명에 함께 연결할 외부 요소 id */
  describedBy?: string;
};

/**
 * 필수 입력 필드. 오류는 aria-live 없이 aria-invalid/aria-describedby 로 연결한다.
 * 제출 중에는 disabled 대신 readOnly 로 잠가 포커스와 값 읽기를 유지한다.
 */
export const TextField = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  counter,
  isOverLimit = false,
  error,
  readOnly,
  placeholder,
  maxLength,
  multiline,
  describedBy,
}: Props) => {
  const id = useId();
  const errorId = `${id}-error`;
  const counterId = `${id}-counter`;
  const describedByIds = [error ? errorId : null, counterId, describedBy]
    .filter(Boolean)
    .join(' ');

  const common = {
    id,
    name,
    value,
    readOnly,
    placeholder,
    maxLength,
    onBlur,
    'aria-required': true,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedByIds,
  } as const;

  const counterClassName = `${multiline ? styles.counter : styles.counterInline} ${isOverLimit ? styles.counterOver : ''}`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        <span className={styles.required}> (필수)</span>
      </label>
      {multiline ? (
        <div
          className={`${styles.textareaWrap} ${error ? styles.invalid : ''}`}
        >
          <textarea
            {...common}
            className={styles.textarea}
            rows={6}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              onChange(event.target.value)
            }
          />
          <p id={counterId} className={counterClassName}>
            {counter}
          </p>
        </div>
      ) : (
        <>
          <input
            {...common}
            type="text"
            className={`${styles.input} ${error ? styles.invalid : ''}`}
            autoComplete="off"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange(event.target.value)
            }
          />
          <p id={counterId} className={counterClassName}>
            {counter}
          </p>
        </>
      )}
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
};
