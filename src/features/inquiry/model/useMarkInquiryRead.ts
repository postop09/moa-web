'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markInquiryRead } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { inquiryQueryKeys } from '../config/queryKeys';
import { mapInquiryLists } from '../lib/updateInquiryLists';

type Variables = { inquiryId: string };

export const useMarkInquiryRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inquiryId }: Variables) =>
      markInquiryRead(createBrowserClient(), inquiryId),
    // 메시지는 읽음 처리로 바뀌지 않으므로 다시 받지 않는다.
    onSuccess: (_result, { inquiryId }) => {
      // 목록은 정렬 기준(hasUnreadReply)이 바뀌므로 다시 받으면 카드가 튄다.
      // 캐시의 배지만 먼저 끄고, 다시 조회는 다음 진입 때로 미룬다.
      mapInquiryLists(queryClient, (items) =>
        items.map((item) =>
          item.id === inquiryId ? { ...item, hasUnreadReply: false } : item,
        ),
      );
      void queryClient.invalidateQueries({
        queryKey: inquiryQueryKeys.list(),
        refetchType: 'none',
      });
      void queryClient.invalidateQueries({
        queryKey: inquiryQueryKeys.unreadCount(),
      });
      void queryClient.invalidateQueries({
        queryKey: inquiryQueryKeys.detail(inquiryId),
      });
    },
  });
};
