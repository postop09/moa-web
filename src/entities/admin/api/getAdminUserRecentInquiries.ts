import type { SupabaseClient } from '@/shared/api';

import type { AdminRecentInquiry } from '../model/adminRecentInquiry';
import type { GetAdminUserRecentInquiriesReq } from '../model/getAdminUserRecentInquiriesReq';

const DEFAULT_LIMIT = 5;

export const getAdminUserRecentInquiries = async (
  supabase: SupabaseClient,
  { inquiryId, limit = DEFAULT_LIMIT }: GetAdminUserRecentInquiriesReq,
): Promise<AdminRecentInquiry[]> => {
  const { data, error } = await supabase.rpc('admin_user_recent_inquiries', {
    p_inquiry_id: inquiryId,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminRecentInquiry[];
};
