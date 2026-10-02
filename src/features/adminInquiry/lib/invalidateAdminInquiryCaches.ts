import type { QueryClient } from '@tanstack/react-query';

import { adminQueryKeys } from '../config/queryKeys';

/** 문의 하나를 바꾼 뒤 화면 곳곳(상세·스레드·이전 문의·미처리 수·목록)을 서버 상태로 다시 맞춘다. */
export const invalidateAdminInquiryCaches = (
  queryClient: QueryClient,
  inquiryId: string,
) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.inquiry(inquiryId),
    }),
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.messages(inquiryId),
    }),
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.recent(inquiryId),
    }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.pendingCount() }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.inquiries() }),
  ]);
