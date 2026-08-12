import { createBrowserClient } from '@/shared/api';

import { TABLE_NAME } from '../config/tableName';

export const deleteHousehold = async (householdId: string): Promise<void> => {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', householdId);

  if (error) {
    throw error;
  }
};
