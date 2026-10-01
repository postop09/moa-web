import type { SupabaseClient } from '@/shared/api';

export const getIsAdmin = async (
  supabase: SupabaseClient,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_admin');

  if (error) {
    throw error;
  }

  return data === true;
};
