import type { SupabaseClient } from '@/shared/api';

import type { AdminInquiry } from '../model/adminInquiry';

/** TABLE 반환의 첫 행. 행이 없으면 null 이 아니라 not_found 로 던진다. */
export const getAdminInquiry = async (
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<AdminInquiry> => {
  const { data, error } = await supabase.rpc('admin_get_inquiry', {
    p_inquiry_id: inquiryId,
  });

  if (error) {
    throw error;
  }

  const row = (data as AdminInquiry[] | null)?.[0];

  if (!row) {
    throw new Error('not_found');
  }

  return row;
};
