import { QueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { authQueryKeys } from '@/entities/auth';

import { shouldDehydrateQuery } from './shouldDehydrateQuery';

// 실제 Query 객체를 QueryCache.build로 만든다. status는 setQueryData(success) /
// 초기 상태(pending) / setState(error)로 만들어 내부 shape 가정을 최소화한다.
const buildQuery = (queryClient: QueryClient, queryKey: QueryKey) =>
  queryClient.getQueryCache().build(queryClient, {
    queryKey,
    queryFn: () => new Promise<never>(() => {}),
  });

const buildSuccessQuery = (queryKey: QueryKey) => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKey, { ok: true });

  const query = queryClient.getQueryCache().find({ queryKey, exact: true });

  if (!query) {
    throw new Error('setQueryData 후 쿼리를 찾을 수 없다');
  }

  return query;
};

const buildPendingQuery = (queryKey: QueryKey) =>
  buildQuery(new QueryClient(), queryKey);

const buildErrorQuery = (queryKey: QueryKey) => {
  const query = buildQuery(new QueryClient(), queryKey);
  query.setState({
    status: 'error',
    error: new Error('실패'),
    fetchStatus: 'idle',
  });

  return query;
};

describe('shouldDehydrateQuery', () => {
  it('success 상태의 일반 쿼리(households list)는 영속화 대상이다', () => {
    const query = buildSuccessQuery(['households', 'list']);

    expect(query.state.status).toBe('success');
    expect(shouldDehydrateQuery(query)).toBe(true);
  });

  it('success 상태여도 auth 쿼리(auth currentUser)는 영속화하지 않는다', () => {
    const query = buildSuccessQuery([...authQueryKeys.currentUser()]);

    expect(query.state.status).toBe('success');
    expect(shouldDehydrateQuery(query)).toBe(false);
  });

  it('pending 상태의 일반 쿼리는 영속화하지 않는다', () => {
    const query = buildPendingQuery(['households', 'list']);

    expect(query.state.status).toBe('pending');
    expect(shouldDehydrateQuery(query)).toBe(false);
  });

  it('error 상태의 일반 쿼리는 영속화하지 않는다', () => {
    const query = buildErrorQuery(['households', 'list']);

    expect(query.state.status).toBe('error');
    expect(shouldDehydrateQuery(query)).toBe(false);
  });
});
