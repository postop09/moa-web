'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { addAdminMemo } from '@/entities/admin';
import type { AddAdminMemoReq } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { invalidateAdminInquiryCaches } from '../lib/invalidateAdminInquiryCaches';

export const useAddAdminMemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddAdminMemoReq) =>
      addAdminMemo(createBrowserClient(), payload),
    // 성공·실패(충돌 포함) 모두 서버 상태를 다시 맞춘다.
    // 갱신을 기다리지 않는다. 실패(충돌 포함)를 호출부가 바로 받아 안내할 수 있어야 한다.
    onSettled: (_result, _error, { inquiryId }) => {
      void invalidateAdminInquiryCaches(queryClient, inquiryId);
    },
  });
};
