import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_COLUMNS } from '../config/columns';
import { INQUIRY_TABLE } from '../config/tableName';
import type { GetInquiryRes } from '../model/getInquiryRes';

/** 삭제됐거나 접근 불가한 문의는 null. 호출부에서 토스트로 안내한다. */
export const getInquiry = async (
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<GetInquiryRes> => {
  const { data, error } = await supabase
    .from(INQUIRY_TABLE)
    .select(INQUIRY_COLUMNS)
    .eq('id', inquiryId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
};
