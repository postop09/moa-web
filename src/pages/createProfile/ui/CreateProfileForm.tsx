'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useCreateProfile } from '@/features/profile';
import { GridBackdrop, MoaLogo } from '@/shared/ui';

import styles from '@/shared/ui/onboardingForm.module.css';

type Props = {
  next?: string | null;
};

export const CreateProfileForm = ({ next }: Props) => {
  const router = useRouter();
  const { mutateAsync, isPending, error } = useCreateProfile();
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = nickname.trim();
    if (!trimmed) {
      return;
    }

    try {
      await mutateAsync(trimmed);
      router.replace(next ?? '/onboarding/household');
    } catch {
      // mutation error state에 표시
    }
  };

  return (
    <main className={styles.page}>
      <GridBackdrop />
      <div className={styles.panel}>
        <header className={styles.hero}>
          <MoaLogo variant="black" size={72} className={styles.brand} />
          <h1 className={styles.headline}>프로필을 만들어 주세요</h1>
          <p className={styles.support}>
            가계부에서 사용할 닉네임을 입력합니다.
          </p>
        </header>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="nickname">
              닉네임
            </label>
            <input
              id="nickname"
              className={styles.input}
              name="nickname"
              type="text"
              autoComplete="nickname"
              maxLength={30}
              required
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              disabled={isPending}
            />
          </div>
          {error ? (
            <p className={styles.error}>
              {error instanceof Error
                ? error.message
                : '프로필 생성에 실패했습니다.'}
            </p>
          ) : null}
          <button className={styles.submit} type="submit" disabled={isPending}>
            {isPending ? '만드는 중…' : '다음'}
          </button>
        </form>
      </div>
    </main>
  );
};
