import type { SupabaseClient } from '@/shared/api';

/** 처리가 필요한(답변 대기 + 처리 중) 문의 수. */
export const getAdminPendingCount = async (
  supabase: SupabaseClient,
): Promise<number> => {
  const { data, error } = await supabase.rpc('admin_pending_inquiry_count');

  if (error) {
    throw error;
  }

  // bigint 는 문자열로 올 수 있다
  return Number(data ?? 0);
};
