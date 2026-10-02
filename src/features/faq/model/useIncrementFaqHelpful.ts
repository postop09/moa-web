'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import { incrementFaqHelpful } from '@/entities/faq';
import { createBrowserClient } from '@/shared/api';

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export const useIncrementFaqHelpful = () => {
  const mutation = useMutation({
    mutationFn: (faqId: string) =>
      incrementFaqHelpful(createBrowserClient(), faqId),
  });
  const { mutateAsync } = mutation;

  // useMutation의 mutate(options) 콜백은 마지막 호출에만 발화한다.
  // 연달아 투표해도 호출마다 성공/실패를 알 수 있도록 mutateAsync로 감싼다.
  const mutate = useCallback(
    (faqId: string, options?: MutateOptions) => {
      mutateAsync(faqId).then(
        () => options?.onSuccess?.(),
        (error: Error) => options?.onError?.(error),
      );
    },
    [mutateAsync],
  );

  return { ...mutation, mutate };
};
