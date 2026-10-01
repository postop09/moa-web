'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { closeInquiry } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { invalidateInquiryCaches } from '../lib/invalidateInquiryCaches';

type Variables = { inquiryId: string };

export const useCloseInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inquiryId }: Variables) =>
      closeInquiry(createBrowserClient(), inquiryId),
    // 성공·실패 모두 서버 상태를 다시 맞춘다(실패해도 다른 기기에서 이미 바뀌었을 수 있다).
    onSettled: (_result, _error, { inquiryId }) =>
      invalidateInquiryCaches(queryClient, inquiryId),
  });
};
