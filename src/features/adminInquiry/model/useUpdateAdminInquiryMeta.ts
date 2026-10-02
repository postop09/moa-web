'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateAdminInquiryMeta } from '@/entities/admin';
import type { UpdateAdminInquiryMetaReq } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { invalidateAdminInquiryCaches } from '../lib/invalidateAdminInquiryCaches';

export const useUpdateAdminInquiryMeta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAdminInquiryMetaReq) =>
      updateAdminInquiryMeta(createBrowserClient(), payload),
    // 성공·실패 모두 서버 상태를 다시 맞춘다.
    // 갱신을 기다리지 않는다. 실패를 호출부가 바로 받아 안내할 수 있어야 한다.
    // 메타 변경에는 서버 측 expected-updatedAt 검사가 없다(알려진 후속 과제).
    // 그래서 화면이 서버 값이 바뀐 것을 보면 낡은 초안을 스스로 버린다.
    onSettled: (_result, _error, { inquiryId }) => {
      void invalidateAdminInquiryCaches(queryClient, inquiryId);
    },
  });
};
