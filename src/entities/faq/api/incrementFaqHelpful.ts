import type { SupabaseClient } from '@/shared/api';

export const incrementFaqHelpful = async (
  supabase: SupabaseClient,
  faqId: string,
): Promise<void> => {
  const { error } = await supabase.rpc('increment_faq_helpful', {
    p_faq_id: faqId,
  });

  if (error) {
    throw error;
  }
};
