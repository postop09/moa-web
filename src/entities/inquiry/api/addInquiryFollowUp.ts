import type { SupabaseClient } from '@/shared/api';

import type { AddInquiryFollowUpReq } from '../model/addInquiryFollowUpReq';

/** 생성된 메시지 id를 반환한다. */
export const addInquiryFollowUp = async (
  supabase: SupabaseClient,
  payload: AddInquiryFollowUpReq,
): Promise<string> => {
  const { data, error } = await supabase.rpc('add_inquiry_follow_up', {
    p_inquiry_id: payload.inquiryId,
    p_body: payload.body,
    p_attachments: payload.attachments,
  });

  if (error) {
    throw error;
  }

  return data as string;
};
