'use client';

import { useState } from 'react';

import { signInWithGoogle } from '@/entities/auth';

export const useSignInWithGoogle = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setIsPending(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(message);
      setIsPending(false);
    }
  };

  return { signIn, isPending, error };
};
