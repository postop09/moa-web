'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { signOut } from '@/entities/auth';
import { createBrowserClient } from '@/shared/api';

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const supabase = createBrowserClient();
      await signOut(supabase);
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace('/login');
    },
  });
};
