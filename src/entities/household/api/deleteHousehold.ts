import type { SupabaseClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';

export const deleteHousehold = async (
  supabase: SupabaseClient,
  householdId: string,
): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', householdId);

  if (error) {
    throw error;
  }
};
