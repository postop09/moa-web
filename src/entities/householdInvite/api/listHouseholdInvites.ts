import type { SupabaseClient } from '@/shared/api';

import { mapInviteError } from '../lib/mapInviteError';
import { TABLE_NAME } from '../config/tableName';
import type { ListHouseholdInvitesRes } from '../model/listHouseholdInvitesRes';

export const listHouseholdInvites = async (
  supabase: SupabaseClient,
  householdId: string,
): Promise<ListHouseholdInvitesRes> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('householdId', householdId)
    .eq('status', 'pending')
    .order('createdAt', { ascending: false });

  if (error) {
    throw mapInviteError(error);
  }

  return data;
};
