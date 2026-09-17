'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { clearCurrentHouseholdId } from '@/features/household';
import { getQueryPersister } from '@/shared/lib';

// 세션 만료로 proxy가 /login에 보낸 경로는 useSignOut을 거치지 않으므로 여기서 이전 계정의
// 클라이언트 상태를 비운다. /login은 미인증일 때만 도달하므로 항상 안전하다.
export const ResetClientState = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.clear();
    getQueryPersister().removeClient();
    clearCurrentHouseholdId();
  }, [queryClient]);

  return null;
};
