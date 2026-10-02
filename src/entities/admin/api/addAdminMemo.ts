import type { SupabaseClient } from '@/shared/api';

import type { AddAdminMemoReq } from '../model/addAdminMemoReq';

/** 새 메모 id 를 돌려준다. 메모는 사용자에게 보이지 않는다. */
export const addAdminMemo = async (
  supabase: SupabaseClient,
  payload: AddAdminMemoReq,
): Promise<string> => {
  const { data, error } = await supabase.rpc('admin_add_memo', {
    p_inquiry_id: payload.inquiryId,
    p_body: payload.body,
  });

  if (error) {
    throw error;
  }

  return data as string;
};
