import type { SupabaseClient } from '@/shared/api';

import type { AdminOperator } from '../model/adminOperator';

export const getAdminList = async (
  supabase: SupabaseClient,
): Promise<AdminOperator[]> => {
  const { data, error } = await supabase.rpc('admin_list_admins');

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminOperator[];
};
