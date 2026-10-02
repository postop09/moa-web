import type { SupabaseClient } from '@/shared/api';

import type { UpdateAdminInquiryMetaReq } from '../model/updateAdminInquiryMetaReq';

export const updateAdminInquiryMeta = async (
  supabase: SupabaseClient,
  payload: UpdateAdminInquiryMetaReq,
): Promise<void> => {
  // RPC 에서 null 은 "변경 없음" 이다.
  const { error } = await supabase.rpc('admin_update_inquiry_meta', {
    p_inquiry_id: payload.inquiryId,
    p_status: payload.status ?? null,
    p_assignee_id: payload.assigneeId ?? null,
    p_category: payload.category ?? null,
  });

  if (error) {
    throw error;
  }
};
