import type { SupabaseClient } from '@/shared/api';

/** 답변 대기 문의를 처리 중으로 바꾸고 자신을 담당자로 지정한다. 이미 처리 중이면 아무것도 바꾸지 않는다. */
export const openAdminInquiry = async (
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<void> => {
  const { error } = await supabase.rpc('admin_open_inquiry', {
    p_inquiry_id: inquiryId,
  });

  if (error) {
    throw error;
  }
};
