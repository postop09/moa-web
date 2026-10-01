import type { QueryClient } from '@tanstack/react-query';

import { inquiryQueryKeys } from '../config/queryKeys';

/** 문의 생성·수정·추가 문의 후 목록/미확인 수/상세/메시지 캐시를 모두 무효화한다. */
export const invalidateInquiryCaches = (
  queryClient: QueryClient,
  inquiryId: string,
) => {
  void queryClient.invalidateQueries({ queryKey: inquiryQueryKeys.list() });
  void queryClient.invalidateQueries({
    queryKey: inquiryQueryKeys.unreadCount(),
  });
  void queryClient.invalidateQueries({
    queryKey: inquiryQueryKeys.detail(inquiryId),
  });
  void queryClient.invalidateQueries({
    queryKey: inquiryQueryKeys.messages(inquiryId),
  });
};
