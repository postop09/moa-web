import type { SupabaseClient } from '@/shared/api';

import type { CloseAdminInquiryReq } from '../model/closeAdminInquiryReq';

export const closeAdminInquiry = async (
  supabase: SupabaseClient,
  payload: CloseAdminInquiryReq,
): Promise<void> => {
  const { error } = await supabase.rpc('admin_close_inquiry', {
    p_inquiry_id: payload.inquiryId,
    p_reason: payload.reason,
  });

  if (error) {
    throw error;
  }
};
