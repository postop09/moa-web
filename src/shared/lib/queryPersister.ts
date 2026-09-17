import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  type Persister,
  removeOldestQuery,
} from '@tanstack/react-query-persist-client';

import { QUERY_PERSIST_KEY } from '../config/queryPersist';

let browserPersister: Persister | undefined;

const makePersister = () =>
  createSyncStoragePersister({
    // storage가 undefined면 라이브러리가 no-op persister를 돌려줘 SSR에서도 안전하다.
    storage: typeof window === 'undefined' ? undefined : window.localStorage,
    key: QUERY_PERSIST_KEY,
    throttleTime: 1000,
    // localStorage 용량 초과(QuotaExceeded) 시 조용히 저장에 실패하지 않고 오래된 쿼리부터 버리며 재시도한다.
    retry: removeOldestQuery,
  });

export const getQueryPersister = () => {
  if (typeof window === 'undefined') {
    return makePersister();
  }

  if (!browserPersister) {
    browserPersister = makePersister();
  }

  return browserPersister;
};
