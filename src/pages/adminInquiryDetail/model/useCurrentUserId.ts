'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { getCachedUser } from '@/entities/auth';
import { createBrowserClient } from '@/shared/api';

/**
 * 현재 로그인한 사용자의 id. 확인하지 못하면(거부·미로그인) "사용자 없음" 으로 본다.
 * resolve 는 아직 확인 전일 수 있는 순간(예: 열기 직후)에 값을 기다릴 때 쓴다.
 */
export const useCurrentUserId = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  const resolve = useCallback(async (): Promise<string | null> => {
    try {
      const user = await getCachedUser(createBrowserClient(), queryClient);

      return user?.id ?? null;
    } catch {
      return null;
    }
  }, [queryClient]);

  useEffect(() => {
    let isActive = true;

    void resolve().then((id) => {
      if (isActive) setUserId(id);
    });

    return () => {
      isActive = false;
    };
  }, [resolve]);

  return { userId, resolve };
};
