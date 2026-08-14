import type { SupabaseClient } from '@/shared/api';

import { mapInviteError } from '../lib/mapInviteError';
import { TABLE_NAME } from '../config/tableName';

export const cancelHouseholdInvite = async (
  supabase: SupabaseClient,
  id: string,
): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    throw mapInviteError(error);
  }
};
