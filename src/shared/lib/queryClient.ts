import { QueryClient } from '@tanstack/react-query';

import { QUERY_PERSIST_MAX_AGE_MS } from '../config/queryPersist';

let browserQueryClient: QueryClient | undefined;

const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        // 다른 화면에 머무는 동안 observer 없는 대시보드 쿼리가 5분 뒤 GC되면 영속 캐시에서도 빠진다.
        gcTime: QUERY_PERSIST_MAX_AGE_MS,
        refetchOnWindowFocus: false,
      },
    },
  });
};

export const getQueryClient = () => {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
};
