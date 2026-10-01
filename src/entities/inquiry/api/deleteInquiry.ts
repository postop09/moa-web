import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_TABLE } from '../config/tableName';

/**
 * DB 행(+cascade 메시지)을 먼저 삭제한다. 이후 Storage 객체는
 * deleteInquiryAttachments로 best-effort 정리한다 (고아 파일이 깨진 스레드보다 낫다).
 * 첨부 경로는 삭제 전에 미리 확보해 둬야 한다.
 */
export const deleteInquiry = async (
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<void> => {
  const { error } = await supabase
    .from(INQUIRY_TABLE)
    .delete()
    .eq('id', inquiryId);

  if (error) {
    throw error;
  }
};
