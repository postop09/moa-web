'use client';

import { useQuery } from '@tanstack/react-query';

import { getAdminList } from '@/entities/admin';
import { createBrowserClient } from '@/shared/api';

import { adminQueryKeys } from '../config/queryKeys';

/** 운영자 목록은 거의 바뀌지 않아 10분 동안 다시 조회하지 않는다. */
const OPERATORS_STALE_MS = 10 * 60 * 1000;

export const useAdminOperators = () =>
  useQuery({
    queryKey: adminQueryKeys.operators(),
    queryFn: () => getAdminList(createBrowserClient()),
    staleTime: OPERATORS_STALE_MS,
  });
