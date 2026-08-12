'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useCreateHousehold } from '@/features/household';
import { GridBackdrop } from '@/shared/ui';

import styles from './createHousehold.module.css';

export const CreateHouseholdForm = () => {
  const router = useRouter();
  const { mutateAsync, isPending, error } = useCreateHousehold();
  const [name, setName] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    try {
      await mutateAsync(trimmed);
      router.replace('/');
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <main className={styles.page}>
      <GridBackdrop />
      <div className={styles.panel}>
        <header className={styles.hero}>
          <p className={styles.brand}>Moa</p>
          <h1 className={styles.headline}>가계부를 만들어 주세요</h1>
          <p className={styles.support}>함께 관리할 가계부 이름을 정합니다.</p>
        </header>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="householdName">
              가계부 이름
            </label>
            <input
              id="householdName"
              className={styles.input}
              name="householdName"
              type="text"
              autoComplete="off"
              maxLength={40}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
            />
          </div>
          {error ? (
            <p className={styles.error}>
              {error instanceof Error
                ? error.message
                : '가계부 생성에 실패했습니다.'}
            </p>
          ) : null}
          <button className={styles.submit} type="submit" disabled={isPending}>
            {isPending ? '만드는 중…' : '시작하기'}
          </button>
        </form>
      </div>
    </main>
  );
};
