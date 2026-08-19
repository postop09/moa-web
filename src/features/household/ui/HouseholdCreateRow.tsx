'use client';

import { Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import type { Household } from '@/entities/household';

import { useCreateHousehold } from '../model/useCreateHousehold';
import styles from './householdPageTitle.module.css';

type Props = {
  onCreated: (household: Household) => void;
};

export const HouseholdCreateRow = ({ onCreated }: Props) => {
  const { mutateAsync, isPending, error } = useCreateHousehold();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!creating) {
      return;
    }

    inputRef.current?.focus();
  }, [creating]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    try {
      const household = await mutateAsync(trimmed);
      onCreated(household);
    } catch {
      // mutation error state에 표시
    }
  };

  if (!creating) {
    return (
      <button
        type="button"
        className={styles.createButton}
        onClick={() => setCreating(true)}
      >
        <Plus size={16} aria-hidden />
        가계부 생성하기
      </button>
    );
  }

  return (
    <form className={styles.createForm} onSubmit={handleSubmit}>
      <label className={styles.visuallyHidden} htmlFor={inputId}>
        가계부 이름
      </label>
      <div className={styles.createRow}>
        <input
          id={inputId}
          ref={inputRef}
          className={styles.createInput}
          name="householdName"
          type="text"
          autoComplete="off"
          maxLength={40}
          required
          placeholder="가계부 이름"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
        />
        <button
          type="submit"
          className={styles.createSubmit}
          disabled={isPending || name.trim().length === 0}
        >
          {isPending ? '만드는 중' : '확인'}
        </button>
      </div>
      {error ? (
        <p className={styles.createError}>
          {error instanceof Error
            ? error.message
            : '가계부 생성에 실패했습니다.'}
        </p>
      ) : null}
    </form>
  );
};
