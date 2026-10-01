import type { SupabaseClient } from '@/shared/api';

export const markInquiryRead = async (
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<void> => {
  const { error } = await supabase.rpc('mark_inquiry_read', {
    p_inquiry_id: inquiryId,
  });

  if (error) {
    throw error;
  }
};
