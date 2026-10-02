import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_TABLE } from '../config/tableName';

export const getUnreadReplyCount = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<number> => {
  const { count, error } = await supabase
    .from(INQUIRY_TABLE)
    .select('id', { count: 'exact', head: true })
    // RLS가 본인 행만 허용하지만 의도를 드러내기 위해 명시적으로도 필터링한다
    .eq('userId', userId)
    .eq('hasUnreadReply', true);

  if (error) {
    throw error;
  }

  return count ?? 0;
};
