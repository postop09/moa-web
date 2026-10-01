import type { SupabaseClient } from '@/shared/api';

import type { UpdateInquiryReq } from '../model/updateInquiryReq';

export const updateInquiry = async (
  supabase: SupabaseClient,
  payload: UpdateInquiryReq,
): Promise<void> => {
  const { error } = await supabase.rpc('update_inquiry', {
    p_inquiry_id: payload.inquiryId,
    p_title: payload.title,
    p_body: payload.body,
  });

  if (error) {
    throw error;
  }
};
