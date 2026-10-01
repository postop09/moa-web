'use client';

import { useQuery } from '@tanstack/react-query';

import { getInquiryMessages } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { inquiryQueryKeys } from '../config/queryKeys';

export const useInquiryMessages = (inquiryId: string) =>
  useQuery({
    queryKey: inquiryQueryKeys.messages(inquiryId),
    queryFn: () => getInquiryMessages(createBrowserClient(), inquiryId),
  });
