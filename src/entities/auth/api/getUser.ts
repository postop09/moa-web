import type { SupabaseClient } from '@/shared/api';

export const getUser = async (supabase: SupabaseClient) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
