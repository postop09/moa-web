'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { openAdminInquiry } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { invalidateAdminInquiryCaches } from '../lib/invalidateAdminInquiryCaches';

type Variables = { inquiryId: string };

export const useOpenAdminInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inquiryId }: Variables) =>
      openAdminInquiry(createBrowserClient(), inquiryId),
    // 열기는 갱신된 상태를 받을 때까지 진행 중으로 둔다. 화면이 낡은 updatedAt 으로 답변하지 않게 한다.
    onSettled: (_result, _error, { inquiryId }) =>
      invalidateAdminInquiryCaches(queryClient, inquiryId),
  });
};
