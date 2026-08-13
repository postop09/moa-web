import type { SupabaseClient } from '@/shared/api';

export const signOut = async (supabase: SupabaseClient) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};
