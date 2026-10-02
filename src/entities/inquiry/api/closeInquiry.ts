import type { SupabaseClient } from '@/shared/api';

export const closeInquiry = async (
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<void> => {
  const { error } = await supabase.rpc('close_inquiry', {
    p_inquiry_id: inquiryId,
  });

  if (error) {
    throw error;
  }
};
