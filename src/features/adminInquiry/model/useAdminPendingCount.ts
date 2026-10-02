'use client';

import { useQuery } from '@tanstack/react-query';

import { getAdminPendingCount } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { adminQueryKeys } from '../config/queryKeys';

const REFETCH_INTERVAL_MS = 60_000;

/** 처리가 필요한 문의 수(사이드바 배지). 1분마다 갱신한다. */
export const useAdminPendingCount = () =>
  useQuery({
    queryKey: adminQueryKeys.pendingCount(),
    queryFn: () => getAdminPendingCount(createBrowserClient()),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
