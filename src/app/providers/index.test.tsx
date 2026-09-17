import { QueryClient, dehydrate, useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getQueryClient } from '@/shared/lib';

// PwaInstallPrompt는 window.matchMedia 등 jsdom 미지원 API를 쓰므로(features/pwaInstall/lib/isStandalone.ts)
// 다른 슬라이스 공개 API(barrel)를 통째로 비운다.
vi.mock('@/features/pwaInstall', () => ({
  PwaInstallPrompt: () => null,
}));

import { Providers } from './index';

const PERSIST_KEY = 'moa:query-cache';
const HOUSEHOLDS_KEY = ['households', 'list'];
const ONE_HOUR_MS = 60 * 60 * 1000;

type Household = { id: string; name: string };

// queryFn은 절대 resolve되지 않는다. 화면에 '우리집'이 보이면 네트워크가 아니라
// localStorage 캐시 복원으로 온 것임을 보장한다.
const HouseholdName = () => {
  const { data, isPending } = useQuery<Household[]>({
    queryKey: HOUSEHOLDS_KEY,
    queryFn: () => new Promise<never>(() => {}),
    staleTime: Infinity,
  });

  if (isPending) {
    return <span>대기 중</span>;
  }

  return <span>{data?.[0]?.name}</span>;
};

const seedPersistedCache = ({
  buster = 'v1',
  timestamp = Date.now(),
}: { buster?: string; timestamp?: number } = {}) => {
  const seed = new QueryClient();
  seed.setQueryData<Household[]>(HOUSEHOLDS_KEY, [
    { id: 'h1', name: '우리집' },
  ]);

  localStorage.setItem(
    PERSIST_KEY,
    JSON.stringify({ timestamp, buster, clientState: dehydrate(seed) }),
  );
};

const renderProviders = () =>
  render(
    <Providers>
      <HouseholdName />
    </Providers>,
  );

describe('Providers - 쿼리 캐시 영속화 복원', () => {
  beforeEach(() => {
    localStorage.clear();
    // getQueryClient는 브라우저 싱글턴이라 케이스 간 캐시가 새어 나가지 않도록 비운다.
    getQueryClient().clear();
  });

  afterEach(() => {
    getQueryClient().clear();
    localStorage.clear();
  });

  it('localStorage에 유효한 캐시가 있으면 복원해 네트워크 없이 즉시 데이터를 보여준다', async () => {
    seedPersistedCache();

    renderProviders();

    expect(await screen.findByText('우리집')).toBeInTheDocument();
  });

  it('buster가 다르면 캐시를 복원하지 않고 폐기한다', async () => {
    seedPersistedCache({ buster: 'v0' });

    renderProviders();

    // buster 불일치 시 persister가 저장된 캐시를 제거한다 → 복원 완료 신호로 사용
    await waitFor(() => {
      expect(localStorage.getItem(PERSIST_KEY)).toBeNull();
    });

    expect(screen.queryByText('우리집')).not.toBeInTheDocument();
    expect(screen.getByText('대기 중')).toBeInTheDocument();
  });

  it('timestamp가 maxAge(24시간)를 넘었으면 캐시를 복원하지 않고 폐기한다', async () => {
    seedPersistedCache({ timestamp: Date.now() - 25 * ONE_HOUR_MS });

    renderProviders();

    await waitFor(() => {
      expect(localStorage.getItem(PERSIST_KEY)).toBeNull();
    });

    expect(screen.queryByText('우리집')).not.toBeInTheDocument();
    expect(screen.getByText('대기 중')).toBeInTheDocument();
  });
});
