'use client';

import { useQuery } from '@tanstack/react-query';

import { getAdminInquiryMessages } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { adminQueryKeys } from '../config/queryKeys';

/** 스레드(내부 메모 포함). */
export const useAdminInquiryMessages = (inquiryId: string) =>
  useQuery({
    queryKey: adminQueryKeys.messages(inquiryId),
    queryFn: () => getAdminInquiryMessages(createBrowserClient(), inquiryId),
    refetchOnMount: 'always',
  });
