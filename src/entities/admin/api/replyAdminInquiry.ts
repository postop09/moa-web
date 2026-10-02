import type { SupabaseClient } from '@/shared/api';

import type { ReplyAdminInquiryReq } from '../model/replyAdminInquiryReq';

/** 새 답변 메시지 id 를 돌려준다. 다른 운영자가 먼저 바꿨다면 conflict 로 던진다. */
export const replyAdminInquiry = async (
  supabase: SupabaseClient,
  payload: ReplyAdminInquiryReq,
): Promise<string> => {
  const { data, error } = await supabase.rpc('admin_reply_inquiry', {
    p_inquiry_id: payload.inquiryId,
    p_body: payload.body,
    p_attachments: payload.attachments,
    p_expected_last_message_id: payload.expectedLastMessageId,
    p_expected_updated_at: payload.expectedUpdatedAt,
  });

  if (error) {
    throw error;
  }

  return data as string;
};
