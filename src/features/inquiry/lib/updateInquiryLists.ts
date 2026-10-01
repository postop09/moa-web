import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { GetMyInquiriesRes } from '@/entities/inquiry';

import { inquiryQueryKeys } from '../config/queryKeys';

type ListData = InfiniteData<GetMyInquiriesRes>;

const isListData = (data: unknown): data is ListData =>
  typeof data === 'object' &&
  data !== null &&
  Array.isArray((data as ListData).pages);

/** 캐시된 모든 탭의 목록(무한 쿼리 페이지)에 변환을 적용한다. 페이지 구조와 순서는 유지한다. */
export const mapInquiryLists = (
  queryClient: QueryClient,
  mapItems: (items: GetMyInquiriesRes['items']) => GetMyInquiriesRes['items'],
) => {
  queryClient.setQueriesData<ListData>(
    { queryKey: inquiryQueryKeys.list() },
    (data) =>
      isListData(data)
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: mapItems(page.items),
            })),
          }
        : data,
  );
};
