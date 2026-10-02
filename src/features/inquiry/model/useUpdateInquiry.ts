'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateInquiry } from '@/entities/inquiry';
import type { UpdateInquiryReq } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { invalidateInquiryCaches } from '../lib/invalidateInquiryCaches';

export const useUpdateInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateInquiryReq) =>
      updateInquiry(createBrowserClient(), payload),
    onSuccess: (_result, { inquiryId }) =>
      invalidateInquiryCaches(queryClient, inquiryId),
  });
};
