'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import {
  deleteInquiry,
  deleteInquiryAttachments,
  getInquiryMessages,
} from '@/entities/inquiry';
import type { InquiryMessage } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { inquiryQueryKeys } from '../config/queryKeys';
import { mapInquiryLists } from '../lib/updateInquiryLists';

/**
 * 구독자(마운트된 화면)가 없으면 바로, 있으면 모두 사라진 뒤에 캐시를 지운다.
 * 구독자가 남은 채 지우면 삭제된 행을 다시 조회하려는 요청이 나가기 때문이다.
 */
const removeWhenUnobserved = (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
) => {
  const cache = queryClient.getQueryCache();
  const query = cache.find({ queryKey, exact: true });

  if (!query) return;

  if (query.getObserversCount() === 0) {
    queryClient.removeQueries({ queryKey, exact: true });
    return;
  }

  const unsubscribe = cache.subscribe((event) => {
    if (event.query !== query) return;

    if (event.type === 'removed') {
      unsubscribe();
      return;
    }

    if (event.type !== 'observerRemoved') return;

    // 구독 해제 도중에 제거하지 않도록 한 틱 미루고, 그 사이 다시 붙었는지 확인한다.
    queueMicrotask(() => {
      if (query.getObserversCount() > 0) return;

      unsubscribe();
      queryClient.removeQueries({ queryKey, exact: true });
    });
  });
};

type Variables = { inquiryId: string };

type Options = {
  /**
   * 캐시 정리 뒤에 호출한다. mutation 옵션이라 호출 컴포넌트가 사라져도 실행되므로
   * 토스트·화면 이동처럼 살아남아야 하는 부수 효과는 여기에 둔다.
   */
  onSuccess?: (inquiryId: string) => void;
};

export const useDeleteInquiry = ({ onSuccess }: Options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inquiryId }: Variables) => {
      const supabase = createBrowserClient();

      // 행이 사라지면 메시지를 읽을 수 없으니 경로는 삭제 전에 확보한다.
      const messages =
        queryClient.getQueryData<InquiryMessage[]>(
          inquiryQueryKeys.messages(inquiryId),
        ) ?? (await getInquiryMessages(supabase, inquiryId));
      const paths = messages.flatMap((message) => message.attachments);

      // 행을 먼저 지운다. Storage 정리가 실패해도 고아 파일이 남을 뿐이다.
      await deleteInquiry(supabase, inquiryId);

      try {
        await deleteInquiryAttachments(supabase, paths);
      } catch {
        // best-effort: 이미 삭제는 끝났으므로 사용자에게는 성공으로 보인다.
      }
    },
    onSuccess: (_result, { inquiryId }) => {
      mapInquiryLists(queryClient, (items) =>
        items.filter((item) => item.id !== inquiryId),
      );
      // 목록은 캐시에서 이미 뺐다. 다시 조회는 다음 진입 때로 미룬다.
      void queryClient.invalidateQueries({
        queryKey: inquiryQueryKeys.list(),
        refetchType: 'none',
      });
      void queryClient.invalidateQueries({
        queryKey: inquiryQueryKeys.unreadCount(),
      });
      removeWhenUnobserved(queryClient, inquiryQueryKeys.detail(inquiryId));
      removeWhenUnobserved(queryClient, inquiryQueryKeys.messages(inquiryId));
      onSuccess?.(inquiryId);
    },
  });
};
