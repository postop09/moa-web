import type { SupabaseClient } from '@/shared/api';

import type { RateInquiryReq } from '../model/rateInquiryReq';

export const rateInquiry = async (
  supabase: SupabaseClient,
  payload: RateInquiryReq,
): Promise<void> => {
  const { error } = await supabase.rpc('rate_inquiry', {
    p_inquiry_id: payload.inquiryId,
    p_rating: payload.rating,
  });

  if (error) {
    throw error;
  }
};
