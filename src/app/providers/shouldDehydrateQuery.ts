import type { Query } from '@tanstack/react-query';

import { authQueryKeys } from '@/entities/auth';

// 읽는 필드만 받아 데이터 타입이 다른 Query 인스턴스(Query<never> 등)도 그대로 넘길 수 있게 한다.
type DehydrateCandidate = Pick<Query, 'queryKey' | 'state'>;

export const shouldDehydrateQuery = (query: DehydrateCandidate) =>
  query.state.status === 'success' &&
  query.queryKey[0] !== authQueryKeys.all[0];
