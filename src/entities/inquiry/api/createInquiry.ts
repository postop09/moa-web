import type { SupabaseClient } from '@/shared/api';

import type { CreateInquiryReq } from '../model/createInquiryReq';

/** 생성된 문의 id를 반환한다. */
export const createInquiry = async (
  supabase: SupabaseClient,
  payload: CreateInquiryReq,
): Promise<string> => {
  const { data, error } = await supabase.rpc('create_inquiry', {
    p_title: payload.title,
    p_body: payload.body,
    p_category: payload.category,
    p_confidence: payload.confidence,
    p_device_info: payload.deviceInfo,
    p_attachments: payload.attachments,
  });

  if (error) {
    throw error;
  }

  return data as string;
};
