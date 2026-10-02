import { useId, type Ref } from 'react';

import { BODY_MAX } from '../config/texts';

import styles from './composer.module.css';

type Props = {
  label: string;
  placeholder: string;
  value: string;
  readOnly: boolean;
  textareaRef: Ref<HTMLTextAreaElement>;
  onChange: (value: string) => void;
};

/** 라벨이 붙은 입력창과 "{n} / 2,000" 글자 수. */
export const DraftField = ({
  label,
  placeholder,
  value,
  readOnly,
  textareaRef,
  onChange,
}: Props) => {
  const id = useId();
  const counterId = `${id}-counter`;
  const overId = `${id}-over`;
  const isOver = value.length > BODY_MAX;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className="srOnly">
        {label}
      </label>
      <textarea
        id={id}
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-invalid={isOver || undefined}
        aria-describedby={isOver ? `${counterId} ${overId}` : counterId}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className={styles.counterRow}>
        {isOver ? (
          <p id={overId} className={styles.counterOver}>
            {`${BODY_MAX.toLocaleString('en-US')}자를 넘었어요`}
          </p>
        ) : null}
        <p id={counterId} className={styles.counter} data-over={isOver}>
          {`${value.length.toLocaleString('en-US')} / ${BODY_MAX.toLocaleString('en-US')}`}
        </p>
      </div>
    </div>
  );
};
