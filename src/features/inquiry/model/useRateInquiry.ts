'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rateInquiry } from '@/entities/inquiry';
import type { RateInquiryReq } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { invalidateInquiryCaches } from '../lib/invalidateInquiryCaches';

export const useRateInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RateInquiryReq) =>
      rateInquiry(createBrowserClient(), payload),
    // 성공·실패 모두 서버 상태를 다시 맞춘다(실패해도 다른 기기에서 이미 바뀌었을 수 있다).
    onSettled: (_result, _error, { inquiryId }) =>
      invalidateInquiryCaches(queryClient, inquiryId),
  });
};
