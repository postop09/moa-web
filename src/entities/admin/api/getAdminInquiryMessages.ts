import type { SupabaseClient } from '@/shared/api';

import type { AdminInquiryMessage } from '../model/adminInquiryMessage';

export const getAdminInquiryMessages = async (
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<AdminInquiryMessage[]> => {
  const { data, error } = await supabase.rpc('admin_get_inquiry_messages', {
    p_inquiry_id: inquiryId,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminInquiryMessage[];
};
