'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createInquiry } from '@/entities/inquiry';
import type { CreateInquiryReq } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { invalidateInquiryCaches } from '../lib/invalidateInquiryCaches';

/** 성공 시 생성된 문의 id 를 돌려준다. */
export const useCreateInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInquiryReq) =>
      createInquiry(createBrowserClient(), payload),
    onSuccess: (inquiryId) => invalidateInquiryCaches(queryClient, inquiryId),
  });
};
