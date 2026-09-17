'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { signOut } from '@/entities/auth';
import { createBrowserClient } from '@/shared/api';
import { getQueryPersister } from '@/shared/lib';

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const supabase = createBrowserClient();
      await signOut(supabase);
    },
    onSuccess: () => {
      // 메모리 캐시를 먼저 비운 뒤 저장소를 지운다. clear 이후 persister 구독자가 빈 캐시를 다시 쓸 수는
      // 있지만 이전 계정 데이터는 남지 않는다. 두 정리가 끝난 뒤 이동해야 다음 화면이 이전 캐시를 보지 않는다.
      queryClient.clear();
      getQueryPersister().removeClient();
      router.replace('/login');
    },
  });
};
