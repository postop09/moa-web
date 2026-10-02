'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { addInquiryFollowUp } from '@/entities/inquiry';
import type { AddInquiryFollowUpReq } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { invalidateInquiryCaches } from '../lib/invalidateInquiryCaches';

export const useAddInquiryFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddInquiryFollowUpReq) =>
      addInquiryFollowUp(createBrowserClient(), payload),
    onSuccess: (_messageId, { inquiryId }) =>
      invalidateInquiryCaches(queryClient, inquiryId),
  });
};
